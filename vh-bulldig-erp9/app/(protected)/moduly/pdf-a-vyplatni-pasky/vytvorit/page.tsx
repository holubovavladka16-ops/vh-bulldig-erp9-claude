import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import DocumentTypeForm from "@/components/documents/DocumentTypeForm";
import GenerateDocumentClient from "@/components/documents/GenerateDocumentClient";
import GpsDocumentationGenerator from "@/components/documents/GpsDocumentationGenerator";
import CompanyInfoPdf from "@/components/documents/pdf/CompanyInfoPdf";
import EmployeeCardPdf from "@/components/documents/pdf/EmployeeCardPdf";
import EmployeeListPdf from "@/components/documents/pdf/EmployeeListPdf";
import AttendanceListingPdf from "@/components/documents/pdf/AttendanceListingPdf";
import CostsOverviewPdf from "@/components/documents/pdf/CostsOverviewPdf";
import InvoicingProfitPdf from "@/components/documents/pdf/InvoicingProfitPdf";
import PayrollOverviewPdf from "@/components/documents/pdf/PayrollOverviewPdf";
import PayslipPdf from "@/components/documents/pdf/PayslipPdf";
import EmployeeReportPdf from "@/components/reports/pdf/EmployeeReportPdf";
import OrderReportPdf from "@/components/reports/pdf/OrderReportPdf";
import ConstructionLogPdf from "@/components/construction-log/ConstructionLogPdf";
import ConnectionPdf from "@/components/connections/ConnectionPdf";
import { buildEmployeeReport, buildOrderReport } from "@/lib/reports";
import { buildPayrollSummary } from "@/lib/payroll";
import { calculateProfit } from "@/lib/profit";
import { COST_CATEGORIES } from "@/lib/costs";
import { sanitizeFileName } from "@/lib/documentStorage";
import { documentTypeLabel } from "@/lib/documentTypes";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type {
  AttendanceRecord,
  AttendanceWorkItem,
  Connection,
  ConnectionPhoto,
  ConnectionPoint,
  ConstructionLogEntry,
  Cost,
  CostCategory,
  DocumentType,
  Employee,
  EmploymentType,
  GpsPhoto,
  InvoicingRecord,
  Order,
} from "@/types/database.types";

export const metadata = {
  title: "Vytvořit dokument | VH Bulldig ERP 9",
};

const MODULE_KEY = "pdf-a-vyplatni-pasky";

interface Props {
  searchParams: {
    typ?: string;
    zamestnanec?: string;
    zakazka?: string;
    pripojka?: string;
    od?: string;
    do?: string;
  };
}

export default async function CreateDocumentPage({ searchParams }: Props) {
  const ctx = await loadAppContext();
  if (!ctx) redirect("/prihlaseni");

  const { profile, company, grantedKeys, isMajitel, isAdministrator, isUcetni, visibleModules } = ctx!;
  const canCreate = isMajitel || ((isAdministrator || isUcetni) && grantedKeys.has(MODULE_KEY));

  const shellProps = {
    modules: visibleModules,
    companyName: company?.name ?? "",
    logoUrl: company?.logo_url,
    fullName: profile.full_name || profile.email,
    role: profile.role,
  };

  if (!canCreate || !company) {
    return (
      <AppShell {...shellProps}>
        <p className="mx-auto max-w-md rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-300">
          {NO_PERMISSION_MESSAGE}
        </p>
      </AppShell>
    );
  }

  const supabase = createClient();
  const [{ data: employeesData }, { data: ordersData }, { data: connectionsData }] = await Promise.all([
    supabase.from("employees").select("*").eq("company_id", company.id),
    supabase.from("orders").select("*").eq("company_id", company.id),
    supabase.from("connections").select("*").eq("company_id", company.id),
  ]);
  const employees = (employeesData ?? []) as unknown as Employee[];
  const orders = (ordersData ?? []) as unknown as Order[];
  const connections = (connectionsData ?? []) as unknown as Connection[];
  const orderNameById = Object.fromEntries(orders.map((o) => [o.id, o.name]));
  const employeeNameById = Object.fromEntries(employees.map((e) => [e.id, `${e.first_name} ${e.last_name}`]));

  const typ = searchParams.typ as DocumentType | undefined;

  if (!typ) {
    return (
      <AppShell {...shellProps}>
        <h1 className="mb-6 font-display text-xl font-semibold text-white">Vytvořit dokument</h1>
        <DocumentTypeForm employees={employees} orders={orders} connections={connections} />
      </AppShell>
    );
  }

  const employeeId = searchParams.zamestnanec ?? "";
  const orderId = searchParams.zakazka ?? "";
  const connectionId = searchParams.pripojka ?? "";
  const dateFrom = searchParams.od ?? "";
  const dateTo = searchParams.do ?? "";

  const missing = (label: string) => (
    <AppShell {...shellProps}>
      <p className="mx-auto max-w-md rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-300">{label}</p>
    </AppShell>
  );

  const commonGenProps = {
    companyId: company.id,
    createdByProfileId: profile.id,
    createdByName: profile.full_name || profile.email,
  };

  const wrap = (title: string, element: React.ReactElement, fileName: string, extra?: Record<string, string>) => (
    <AppShell {...shellProps}>
      <h1 className="mb-6 font-display text-xl font-semibold text-white">{title}</h1>
      <GenerateDocumentClient
        documentElement={element}
        documentType={typ}
        fileName={fileName}
        employeeId={extra?.employeeId}
        orderId={extra?.orderId}
        periodFrom={extra?.periodFrom}
        periodTo={extra?.periodTo}
        {...commonGenProps}
      />
    </AppShell>
  );

  switch (typ) {
    case "firemni_udaje": {
      return wrap("Firemní údaje", <CompanyInfoPdf company={company} />, `${sanitizeFileName(company.name)}-firemni-udaje.pdf`);
    }

    case "karta_zamestnance": {
      const employee = employees.find((e) => e.id === employeeId);
      if (!employee) return missing("Vyberte zaměstnance.");
      const { data: typeData } = await supabase.from("employment_types").select("*").eq("id", employee.employment_type_id).maybeSingle();
      const employmentType = typeData as unknown as EmploymentType | null;
      return wrap(
        "Karta zaměstnance",
        <EmployeeCardPdf company={company} employee={employee} employmentTypeName={employmentType?.name ?? "—"} />,
        `karta-zamestnance-${sanitizeFileName(employee.last_name)}.pdf`,
        { employeeId: employee.id }
      );
    }

    case "seznam_zamestnancu": {
      return wrap("Seznam zaměstnanců", <EmployeeListPdf company={company} employees={employees} />, "seznam-zamestnancu.pdf");
    }

    case "dochazka_zamestnance": {
      const employee = employees.find((e) => e.id === employeeId);
      if (!employee) return missing("Vyberte zaměstnance.");
      let q = supabase.from("attendance_records").select("*").eq("employee_id", employee.id);
      if (dateFrom) q = q.gte("record_date", dateFrom);
      if (dateTo) q = q.lte("record_date", dateTo);
      const { data } = await q.order("record_date", { ascending: true });
      const records = (data ?? []) as unknown as AttendanceRecord[];
      return wrap(
        "Docházka zaměstnance",
        <AttendanceListingPdf
          company={company}
          title="Docházka zaměstnance"
          subtitle={`${employee.first_name} ${employee.last_name} · ${dateFrom || "—"} – ${dateTo || "—"}`}
          records={records}
          employeeNameById={employeeNameById}
          orderNameById={orderNameById}
          showEmployeeColumn={false}
        />,
        `dochazka-${sanitizeFileName(employee.last_name)}.pdf`,
        { employeeId: employee.id, periodFrom: dateFrom, periodTo: dateTo }
      );
    }

    case "dochazka_za_obdobi": {
      let q = supabase.from("attendance_records").select("*").eq("company_id", company.id);
      if (dateFrom) q = q.gte("record_date", dateFrom);
      if (dateTo) q = q.lte("record_date", dateTo);
      const { data } = await q.order("record_date", { ascending: true });
      const records = (data ?? []) as unknown as AttendanceRecord[];
      return wrap(
        "Docházka za období",
        <AttendanceListingPdf
          company={company}
          title="Docházka za období"
          subtitle={`${dateFrom || "—"} – ${dateTo || "—"}`}
          records={records}
          employeeNameById={employeeNameById}
          orderNameById={orderNameById}
          showEmployeeColumn
        />,
        "dochazka-za-obdobi.pdf",
        { periodFrom: dateFrom, periodTo: dateTo }
      );
    }

    case "vykaz_zamestnance": {
      const employee = employees.find((e) => e.id === employeeId);
      if (!employee) return missing("Vyberte zaměstnance.");
      let q = supabase.from("attendance_records").select("*").eq("employee_id", employee.id);
      if (dateFrom) q = q.gte("record_date", dateFrom);
      if (dateTo) q = q.lte("record_date", dateTo);
      const { data: recordsData } = await q;
      const records = (recordsData ?? []) as unknown as AttendanceRecord[];
      const { data: itemsData } = await supabase
        .from("attendance_work_items")
        .select("*")
        .in("attendance_record_id", records.map((r) => r.id).length ? records.map((r) => r.id) : ["-"]);
      const items = (itemsData ?? []) as unknown as AttendanceWorkItem[];
      const itemsByRecordId = items.reduce((acc: Record<string, AttendanceWorkItem[]>, i) => {
        (acc[i.attendance_record_id] ??= []).push(i);
        return acc;
      }, {});
      const report = buildEmployeeReport(employee, records, itemsByRecordId, orderNameById, dateFrom, dateTo);
      return wrap(
        "Výkaz zaměstnance",
        <EmployeeReportPdf report={report} company={company} />,
        `vykaz-zamestnance-${sanitizeFileName(employee.last_name)}.pdf`,
        { employeeId: employee.id, periodFrom: dateFrom, periodTo: dateTo }
      );
    }

    case "vykaz_zakazky": {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return missing("Vyberte zakázku.");
      let q = supabase.from("attendance_records").select("*").eq("order_id", order.id);
      if (dateFrom) q = q.gte("record_date", dateFrom);
      if (dateTo) q = q.lte("record_date", dateTo);
      const { data: recordsData } = await q;
      const records = (recordsData ?? []) as unknown as AttendanceRecord[];
      const { data: itemsData } = await supabase
        .from("attendance_work_items")
        .select("*")
        .in("attendance_record_id", records.map((r) => r.id).length ? records.map((r) => r.id) : ["-"]);
      const items = (itemsData ?? []) as unknown as AttendanceWorkItem[];
      const itemsByRecordId = items.reduce((acc: Record<string, AttendanceWorkItem[]>, i) => {
        (acc[i.attendance_record_id] ??= []).push(i);
        return acc;
      }, {});
      const employeeById = Object.fromEntries(employees.map((e) => [e.id, e]));
      const report = buildOrderReport(order, records, itemsByRecordId, employeeById, dateFrom, dateTo);
      return wrap(
        "Výkaz zakázky",
        <OrderReportPdf report={report} company={company} />,
        `vykaz-zakazky-${sanitizeFileName(order.name)}.pdf`,
        { orderId: order.id, periodFrom: dateFrom, periodTo: dateTo }
      );
    }

    case "prehled_nakladu": {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return missing("Vyberte zakázku.");
      let costsQ = supabase.from("costs").select("*").eq("order_id", order.id);
      if (dateFrom) costsQ = costsQ.gte("cost_date", dateFrom);
      if (dateTo) costsQ = costsQ.lte("cost_date", dateTo);
      const { data: costsData } = await costsQ;
      const costs = (costsData ?? []) as unknown as Cost[];
      const categoryTotals = Object.fromEntries(COST_CATEGORIES.map((c) => [c.key, 0])) as Record<CostCategory, number>;
      for (const c of costs) categoryTotals[c.category] += Number(c.amount);

      let attQ = supabase.from("attendance_records").select("*").eq("order_id", order.id).eq("status", "schvaleny");
      if (dateFrom) attQ = attQ.gte("record_date", dateFrom);
      if (dateTo) attQ = attQ.lte("record_date", dateTo);
      const { data: attData } = await attQ;
      const laborCost = ((attData ?? []) as unknown as AttendanceRecord[]).reduce((s, r) => s + Number(r.total_earnings), 0);

      return wrap(
        "Přehled nákladů",
        <CostsOverviewPdf company={company} orderName={order.name} dateFrom={dateFrom} dateTo={dateTo} costs={costs} categoryTotals={categoryTotals} laborCost={laborCost} />,
        `prehled-nakladu-${sanitizeFileName(order.name)}.pdf`,
        { orderId: order.id, periodFrom: dateFrom, periodTo: dateTo }
      );
    }

    case "stavebni_denik": {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return missing("Vyberte zakázku.");
      let q = supabase.from("construction_log_entries").select("*").eq("order_id", order.id);
      if (dateFrom) q = q.gte("log_date", dateFrom);
      if (dateTo) q = q.lte("log_date", dateTo);
      const { data } = await q.order("log_date", { ascending: true });
      const entries = (data ?? []) as unknown as ConstructionLogEntry[];
      const workerNamesByEntryId = Object.fromEntries(
        entries.map((e) => [e.id, e.worker_ids.map((id) => employeeNameById[id] ?? "—").join(", ")])
      );
      return wrap(
        "Stavební deník",
        <ConstructionLogPdf company={company} orderName={order.name} dateFrom={dateFrom} dateTo={dateTo} entries={entries} workerNamesByEntryId={workerNamesByEntryId} />,
        `stavebni-denik-${sanitizeFileName(order.name)}.pdf`,
        { orderId: order.id, periodFrom: dateFrom, periodTo: dateTo }
      );
    }

    case "fakturace_a_prehled_zisku": {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return missing("Vyberte zakázku.");
      let invQ = supabase.from("invoicing_records").select("*").eq("order_id", order.id);
      if (dateFrom) invQ = invQ.lte("period_from", dateTo || "9999-12-31").gte("period_to", dateFrom || "0001-01-01");
      const { data: invData } = await invQ;
      const records = (invData ?? []) as unknown as InvoicingRecord[];
      const invoicedAmount = records.reduce((s, r) => s + Number(r.invoiced_amount), 0);

      let attQ = supabase.from("attendance_records").select("*").eq("order_id", order.id).eq("status", "schvaleny");
      if (dateFrom) attQ = attQ.gte("record_date", dateFrom);
      if (dateTo) attQ = attQ.lte("record_date", dateTo);
      const { data: attData } = await attQ;
      const laborCost = ((attData ?? []) as unknown as AttendanceRecord[]).reduce((s, r) => s + Number(r.total_earnings), 0);

      let costsQ = supabase.from("costs").select("*").eq("order_id", order.id);
      if (dateFrom) costsQ = costsQ.gte("cost_date", dateFrom);
      if (dateTo) costsQ = costsQ.lte("cost_date", dateTo);
      const { data: costsData } = await costsQ;
      const otherCosts = ((costsData ?? []) as unknown as Cost[]).reduce((s, c) => s + Number(c.amount), 0);

      const calc = calculateProfit(invoicedAmount, laborCost, otherCosts);

      return wrap(
        "Fakturace a přehled zisku",
        <InvoicingProfitPdf company={company} orderName={order.name} dateFrom={dateFrom} dateTo={dateTo} records={records} calc={calc} />,
        `fakturace-${sanitizeFileName(order.name)}.pdf`,
        { orderId: order.id, periodFrom: dateFrom, periodTo: dateTo }
      );
    }

    case "kompletni_mzdovy_prehled": {
      let q = supabase.from("attendance_records").select("*").eq("company_id", company.id).eq("status", "schvaleny");
      if (dateFrom) q = q.gte("record_date", dateFrom);
      if (dateTo) q = q.lte("record_date", dateTo);
      const { data: recordsData } = await q;
      const records = (recordsData ?? []) as unknown as AttendanceRecord[];
      const { data: itemsData } = await supabase
        .from("attendance_work_items")
        .select("*")
        .in("attendance_record_id", records.map((r) => r.id).length ? records.map((r) => r.id) : ["-"]);
      const items = (itemsData ?? []) as unknown as AttendanceWorkItem[];
      const itemsByRecordId = items.reduce((acc: Record<string, AttendanceWorkItem[]>, i) => {
        (acc[i.attendance_record_id] ??= []).push(i);
        return acc;
      }, {});

      const summaries = employees
        .map((e) => buildPayrollSummary(e, records.filter((r) => r.employee_id === e.id), itemsByRecordId))
        .filter((s) => s.workDays > 0);

      return wrap(
        "Kompletní mzdový přehled",
        <PayrollOverviewPdf company={company} dateFrom={dateFrom} dateTo={dateTo} summaries={summaries} />,
        "kompletni-mzdovy-prehled.pdf",
        { periodFrom: dateFrom, periodTo: dateTo }
      );
    }

    case "vyplatni_paska": {
      const employee = employees.find((e) => e.id === employeeId);
      if (!employee) return missing("Vyberte zaměstnance.");
      let q = supabase.from("attendance_records").select("*").eq("employee_id", employee.id);
      if (dateFrom) q = q.gte("record_date", dateFrom);
      if (dateTo) q = q.lte("record_date", dateTo);
      const { data: recordsData } = await q;
      const records = (recordsData ?? []) as unknown as AttendanceRecord[];
      const { data: itemsData } = await supabase
        .from("attendance_work_items")
        .select("*")
        .in("attendance_record_id", records.map((r) => r.id).length ? records.map((r) => r.id) : ["-"]);
      const items = (itemsData ?? []) as unknown as AttendanceWorkItem[];
      const itemsByRecordId = items.reduce((acc: Record<string, AttendanceWorkItem[]>, i) => {
        (acc[i.attendance_record_id] ??= []).push(i);
        return acc;
      }, {});
      const report = buildEmployeeReport(employee, records, itemsByRecordId, orderNameById, dateFrom, dateTo);
      return wrap(
        "Výplatní páska",
        <PayslipPdf company={company} report={report} paymentMethod={employee.payment_method} />,
        `vyplatni-paska-${sanitizeFileName(employee.last_name)}.pdf`,
        { employeeId: employee.id, periodFrom: dateFrom, periodTo: dateTo }
      );
    }

    case "dokumentace_pripojky": {
      const connection = connections.find((c) => c.id === connectionId);
      if (!connection) return missing("Vyberte přípojku.");
      const [{ data: pointsData }, { data: photosData }] = await Promise.all([
        supabase.from("connection_points").select("*").eq("connection_id", connection.id).order("point_order"),
        supabase.from("connection_photos").select("*").eq("connection_id", connection.id).order("created_at"),
      ]);
      const points = (pointsData ?? []) as unknown as ConnectionPoint[];
      const photos = (photosData ?? []) as unknown as ConnectionPhoto[];
      return wrap(
        "Dokumentace přípojky",
        <ConnectionPdf company={company} connection={connection} orderName={orderNameById[connection.order_id] ?? "—"} points={points} photos={photos} />,
        `dokumentace-pripojky-${sanitizeFileName(connection.name)}.pdf`,
        { orderId: connection.order_id }
      );
    }

    case "gps_fotodokumentace": {
      let q = supabase.from("gps_photos").select("*").eq("company_id", company.id);
      if (dateFrom) q = q.gte("taken_at", dateFrom);
      if (dateTo) q = q.lte("taken_at", dateTo);
      const { data } = await q.order("taken_at", { ascending: true });
      const photos = (data ?? []) as unknown as GpsPhoto[];
      return (
        <AppShell {...shellProps}>
          <h1 className="mb-6 font-display text-xl font-semibold text-white">GPS fotodokumentace</h1>
          <GpsDocumentationGenerator
            photos={photos}
            orderNameById={orderNameById}
            company={company}
            companyId={company.id}
            periodFrom={dateFrom}
            periodTo={dateTo}
            createdByProfileId={profile.id}
            createdByName={profile.full_name || profile.email}
          />
        </AppShell>
      );
    }

    default:
      return missing(`Neznámý typ dokumentu: ${documentTypeLabel(typ)}`);
  }
}
