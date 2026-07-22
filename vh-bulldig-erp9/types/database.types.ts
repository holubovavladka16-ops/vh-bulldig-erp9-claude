// Typy odpovídají tabulkám vytvořeným v migraci supabase/migrations/0001_modul1_prihlaseni.sql
// Rozšiřovat pouze při přidání dalších potvrzených modulů.

export type EmployeeStatus = "aktivni" | "neaktivni" | "ukonceny" | "pozastaveny";
export type PaymentMethod = "hotove" | "bankovni_ucet";
export type EmployeeChangeType = "vytvoreni" | "osobni_udaje" | "pracovni_udaje" | "zmena_stavu";

export interface EmploymentType {
  id: string;
  company_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Employee {
  id: string;
  company_id: string;
  profile_id: string | null;
  first_name: string;
  last_name: string;
  birth_date: string;
  position: string;
  start_date: string;
  employment_type_id: string;
  payment_method: PaymentMethod;
  birth_number: string | null;
  address: string | null;
  id_card_number: string | null;
  phone: string | null;
  email: string | null;
  bank_account: string | null;
  note: string | null;
  photo_url: string | null;
  photo_path: string | null;
  end_date: string | null;
  status: EmployeeStatus;
  share_token: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeHistoryEntry {
  id: string;
  employee_id: string;
  change_type: EmployeeChangeType;
  changed_by: string | null;
  changed_by_name: string | null;
  details: Record<string, unknown> | null;
  changed_at: string;
}

export interface SharedEmployeeView {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  start_date: string;
  end_date: string | null;
  employment_type_name: string;
  payment_method: PaymentMethod;
  status: EmployeeStatus;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
  note: string | null;
  company_name: string;
  company_logo_url: string | null;
}

export type OrderStatus = "aktivni" | "neaktivni";
export type OrderChangeType = "vytvoreni" | "zmena_nazvu" | "zmena_data_zalozeni" | "zmena_stavu";

export interface Order {
  id: string;
  company_id: string;
  name: string;
  founded_date: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface OrderHistoryEntry {
  id: string;
  order_id: string;
  change_type: OrderChangeType;
  changed_by: string | null;
  changed_by_name: string | null;
  details: Record<string, unknown> | null;
  changed_at: string;
}

export type AttendanceStatus = "rozepsany" | "odeslany" | "schvaleny" | "vraceny_k_oprave";
export type AttendanceChangeType =
  | "vytvoreni"
  | "zmena_zamestnance"
  | "zmena_zakazky"
  | "zmena_pritomnosti"
  | "zmena_pracovni_cinnosti"
  | "zmena_zalohy"
  | "zmena_stavu";

export interface AttendanceRecord {
  id: string;
  company_id: string;
  employee_id: string;
  order_id: string;
  record_date: string;
  note: string | null;
  work_start: string | null;
  work_end: string | null;
  break_minutes: number;
  presence_total_minutes: number | null;
  daily_advance: number;
  advance_payment_method: PaymentMethod | null;
  advance_note: string | null;
  total_earnings: number;
  balance_due: number;
  status: AttendanceStatus;
  approved_by: string | null;
  approved_at: string | null;
  returned_reason: string | null;
  returned_by: string | null;
  returned_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceWorkItem {
  id: string;
  attendance_record_id: string;
  pricing_item_id: string | null;
  activity_name: string;
  unit: PricingUnit;
  unit_price: number;
  quantity: number;
  total_price: number;
  note: string | null;
  created_at: string;
}

export interface AttendanceHistoryEntry {
  id: string;
  attendance_record_id: string;
  change_type: AttendanceChangeType;
  changed_by: string | null;
  changed_by_name: string | null;
  details: Record<string, unknown> | null;
  changed_at: string;
}

export type CostCategory = "material" | "naradi" | "pujcovna" | "ubytovani" | "phm" | "jizdenky" | "jine";
export type CostChangeType =
  | "vytvoreni"
  | "zmena_data"
  | "zmena_zakazky"
  | "zmena_kategorie"
  | "zmena_popisu"
  | "zmena_castky";

export interface Cost {
  id: string;
  company_id: string;
  order_id: string;
  cost_date: string;
  category: CostCategory;
  description: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface CostHistoryEntry {
  id: string;
  cost_id: string;
  change_type: CostChangeType;
  changed_by: string | null;
  changed_by_name: string | null;
  details: Record<string, unknown> | null;
  changed_at: string;
}

export type InvoicingChangeType =
  | "vytvoreni"
  | "zmena_zakazky"
  | "zmena_obdobi"
  | "zmena_castky"
  | "zmena_poznamky";

export interface InvoicingRecord {
  id: string;
  company_id: string;
  order_id: string;
  period_from: string;
  period_to: string;
  invoiced_amount: number;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoicingHistoryEntry {
  id: string;
  invoicing_record_id: string;
  change_type: InvoicingChangeType;
  changed_by: string | null;
  changed_by_name: string | null;
  details: Record<string, unknown> | null;
  changed_at: string;
}

export type ConstructionLogChangeType =
  | "vytvoreni"
  | "zmena_data"
  | "zmena_zakazky"
  | "zmena_pocasi"
  | "zmena_techniky"
  | "zmena_pocet_delniku"
  | "zmena_jmen"
  | "zmena_denni_cinnosti"
  | "zmena_popisu";

export interface ConstructionLogEntry {
  id: string;
  company_id: string;
  order_id: string;
  log_date: string;
  weather: string | null;
  equipment: string | null;
  worker_ids: string[];
  worker_count: number;
  daily_activity: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConstructionLogHistoryEntry {
  id: string;
  entry_id: string;
  change_type: ConstructionLogChangeType;
  changed_by: string | null;
  changed_by_name: string | null;
  details: Record<string, unknown> | null;
  changed_at: string;
}

export type ConnectionMeasurementMethod = "prubezne_gps" | "body_a_b" | "dve_adresy";
export type ConnectionChangeType =
  | "vytvoreni"
  | "zmena_nazvu"
  | "zmena_zakazky"
  | "zmena_mereni"
  | "zmena_delky"
  | "zmena_gps_bodu"
  | "pridani_fotografie"
  | "odstraneni_fotografie"
  | "zmena_poznamky";

export interface Connection {
  id: string;
  company_id: string;
  order_id: string;
  connection_date: string;
  name: string;
  note: string | null;
  measurement_method: ConnectionMeasurementMethod;
  measured_length_meters: number | null;
  measurement_started_at: string | null;
  measurement_ended_at: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConnectionPoint {
  id: string;
  connection_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  point_order: number;
  label: string | null;
  recorded_at: string;
}

export interface ConnectionPhoto {
  id: string;
  connection_id: string;
  point_id: string | null;
  photo_url: string;
  photo_path: string;
  note: string | null;
  created_at: string;
}

export interface ConnectionHistoryEntry {
  id: string;
  connection_id: string;
  change_type: ConnectionChangeType;
  changed_by: string | null;
  changed_by_name: string | null;
  details: Record<string, unknown> | null;
  changed_at: string;
}

export type GpsPhotoChangeType =
  | "vytvoreni"
  | "zmena_zakazky"
  | "zmena_poznamky"
  | "opakovane_nacteni_gps"
  | "zmena_adresy";

export interface GpsPhoto {
  id: string;
  company_id: string;
  order_id: string;
  photo_url: string;
  photo_path: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  address: string | null;
  taken_at: string;
  author_id: string | null;
  author_name: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface GpsPhotoHistoryEntry {
  id: string;
  photo_id: string;
  change_type: GpsPhotoChangeType;
  changed_by: string | null;
  changed_by_name: string | null;
  details: Record<string, unknown> | null;
  changed_at: string;
}

export type DocumentType =
  | "firemni_udaje"
  | "karta_zamestnance"
  | "seznam_zamestnancu"
  | "dochazka_zamestnance"
  | "dochazka_za_obdobi"
  | "vykaz_zamestnance"
  | "vykaz_zakazky"
  | "prehled_nakladu"
  | "stavebni_denik"
  | "fakturace_a_prehled_zisku"
  | "kompletni_mzdovy_prehled"
  | "vyplatni_paska"
  | "dokumentace_pripojky"
  | "gps_fotodokumentace";

export interface GeneratedDocument {
  id: string;
  company_id: string;
  document_type: DocumentType;
  file_name: string;
  file_url: string;
  file_path: string;
  employee_id: string | null;
  order_id: string | null;
  period_from: string | null;
  period_to: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

export type AppDesign = "classic" | "professional" | "industrial" | "modern" | "executive" | "field";
export type LandingPage = "dashboard" | "prehled_modulu";

export interface UserAppSettings {
  id: string;
  profile_id: string;
  sync_devices: boolean;
  theme_synced: AppDesign;
  theme_phone: AppDesign;
  theme_tablet: AppDesign;
  theme_desktop: AppDesign;
  default_landing_page: LandingPage;
  updated_at: string;
}

export type BackupStatus = "probiha" | "dokonceno" | "selhalo";

export interface DatabaseBackup {
  id: string;
  company_id: string;
  status: BackupStatus;
  storage_path: string | null;
  size_bytes: number | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export interface DatabaseRestore {
  id: string;
  company_id: string;
  backup_id: string | null;
  safety_backup_id: string | null;
  status: BackupStatus;
  initiated_by: string | null;
  initiated_by_name: string | null;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export type PaperFormStatus =
  | "vytvoreny"
  | "vytisteny"
  | "prirazeny"
  | "odevzdany"
  | "zkontrolovany"
  | "uzavreny"
  | "zneplatneny";

export type PaperFormChangeType =
  | "vytvoreni"
  | "tisk"
  | "stazeni_pdf"
  | "prvni_naskenovani"
  | "prirazeni"
  | "zmena_stavu"
  | "odevzdani"
  | "kontrola"
  | "uzavreni"
  | "zneplatneni";

export interface PaperForm {
  id: string;
  company_id: string;
  form_number: string;
  share_token: string;
  month: number;
  year: number;
  status: PaperFormStatus;
  employee_id: string | null;
  assigned_at: string | null;
  assigned_by: string | null;
  assigned_by_name: string | null;
  invalidated_reason: string | null;
  invalidated_at: string | null;
  invalidated_by: string | null;
  invalidated_by_name: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaperFormHistoryEntry {
  id: string;
  form_id: string;
  change_type: PaperFormChangeType;
  changed_by: string | null;
  changed_by_name: string | null;
  details: Record<string, unknown> | null;
  changed_at: string;
}

export type CheckOverallResult = "shoda" | "castecna_shoda" | "neshoda" | "nelze_precist";
export type CheckStatus = "probiha" | "potvrzeno" | "vraceno_k_doreseni" | "uzavreno";
export type CheckChangeType =
  | "naskenovani_qr"
  | "nahrani_fotografie"
  | "kontrola_kvality"
  | "rozpoznani_udaju"
  | "rucni_oprava"
  | "spusteni_porovnani"
  | "potvrzeni"
  | "vraceni_k_doreseni"
  | "uzavreni";

export interface PaperFormCheck {
  id: string;
  company_id: string;
  form_id: string;
  employee_id: string;
  month: number;
  year: number;
  recognized_data: Record<string, unknown>;
  corrections: unknown[];
  comparison_result: Record<string, unknown>;
  image_quality_ok: boolean | null;
  image_quality_note: string | null;
  overall_result: CheckOverallResult | null;
  status: CheckStatus;
  reviewer_note: string | null;
  return_reason: string | null;
  returned_at: string | null;
  returned_by: string | null;
  returned_by_name: string | null;
  closed_at: string | null;
  closed_by: string | null;
  closed_by_name: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaperFormCheckPhoto {
  id: string;
  check_id: string;
  file_path: string;
  file_type: string;
  created_at: string;
}

export interface PaperFormCheckHistoryEntry {
  id: string;
  check_id: string;
  change_type: CheckChangeType;
  changed_by: string | null;
  changed_by_name: string | null;
  details: Record<string, unknown> | null;
  changed_at: string;
}

export type DocumentTypeV2 =
  | "pracovni_smlouva" | "dpp" | "dpc" | "dodatek_pracovni_smlouvy"
  | "dohoda_o_ukonceni" | "vypoved" | "potvrzeni_o_zamestnani"
  | "objednavka_praci" | "smlouva_o_dilo" | "dodatek_smlouvy_o_dilo"
  | "predavaci_protokol" | "predavaci_protokol_zakazky" | "protokol_o_prevzeti_praci"
  | "cestne_prohlaseni" | "plna_moc" | "mlcenlivost" | "souhlas_gdpr"
  | "interni_dokument" | "jiny_dokument";

export type DocumentCategoryV2 = "pracovnepravni" | "obchodni" | "ostatni";

export type DocumentStatusV2 =
  | "rozepsany" | "pripraveny_ke_kontrole" | "schvaleny" | "odeslany_k_podpisu"
  | "podepsany" | "ukonceny" | "zruseny" | "archivovany";

export type SignatureMethod = "rucni_na_papire" | "nahrany_soubor" | "na_obrazovce";

export type DocumentChangeType =
  | "vytvoreni" | "zmena_typu" | "zmena_nazvu" | "zmena_smluvni_strany" | "zmena_zamestnance"
  | "zmena_zakazky" | "zmena_textu" | "zmena_ceny" | "zmena_terminu" | "zmena_stavu"
  | "nova_verze" | "schvaleni" | "odeslani" | "podpis" | "ukonceni" | "zruseni" | "archivace";

export interface Counterparty {
  name: string;
  ico: string;
  dic: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  bankAccount: string;
}

export interface DocumentV2 {
  id: string;
  company_id: string;
  document_type: DocumentTypeV2;
  custom_type_name: string | null;
  category: DocumentCategoryV2;
  document_number: string;
  title: string;
  created_date: string;
  effective_date: string | null;
  expiry_date: string | null;
  status: DocumentStatusV2;
  version_number: number;
  employee_id: string | null;
  order_id: string | null;
  related_document_id: string | null;
  counterparty: Counterparty | null;
  variables: Record<string, string>;
  content: string;
  note: string | null;
  sent_to_name: string | null;
  sent_to_contact: string | null;
  sent_at: string | null;
  sent_by_name: string | null;
  approved_at: string | null;
  approved_by_name: string | null;
  terminated_at: string | null;
  cancelled_at: string | null;
  archived_at: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  content: string;
  variables: Record<string, string>;
  reason: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

export interface DocumentAttachment {
  id: string;
  document_id: string;
  file_path: string;
  file_name: string;
  file_type: string;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

export interface DocumentSignature {
  id: string;
  document_id: string;
  signer_name: string;
  signer_role: string;
  employee_id: string | null;
  method: SignatureMethod | null;
  signed: boolean;
  signed_at: string | null;
  version_number: number;
  signature_image_path: string | null;
  uploaded_file_path: string | null;
  created_at: string;
}

export interface DocumentHistoryEntry {
  id: string;
  document_id: string;
  change_type: DocumentChangeType;
  changed_by: string | null;
  changed_by_name: string | null;
  details: Record<string, unknown> | null;
  changed_at: string;
}

export type UserRole = "majitel" | "administrator" | "ucetni" | "zamestnanec";

export type PricingActivityKey =
  | "hodinova_sazba"
  | "rucni_vykop"
  | "pruraz"
  | "demontaz_dlazby"
  | "pokladka_dlazby"
  | "denni_sazba_ukol"
  | "jine";

export type PricingUnit = "hod" | "bm" | "ks" | "m2" | "den";
export type PricingItemStatus = "aktivni" | "neaktivni";

export interface PricingItem {
  id: string;
  company_id: string;
  employee_id: string;
  activity_key: PricingActivityKey;
  activity_name: string;
  unit: PricingUnit;
  unit_price: number;
  valid_from: string;
  valid_to: string | null;
  status: PricingItemStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface PricingPriceHistoryEntry {
  id: string;
  pricing_item_id: string;
  old_price: number;
  new_price: number;
  new_valid_from: string;
  changed_by: string | null;
  changed_by_name: string | null;
  changed_at: string;
}

export type WatermarkSize = "maly" | "stredni" | "velky" | "automaticky";

export interface Company {
  id: string;
  name: string;
  created_at: string;
  // Modul 3 - Nastavení společnosti / Firemní údaje
  slogan: string | null;
  ico: string | null;
  is_vat_payer: boolean;
  dic: string | null;
  phone: string | null;
  email: string | null;
  web: string | null;
  bank_account: string | null;
  jednatel: string | null;
  ucetni_email: string | null;
  street: string | null;
  city: string | null;
  zip: string | null;
  country: string;
  logo_url: string | null;
  logo_path: string | null;
  watermark_url: string | null;
  watermark_path: string | null;
  watermark_opacity: number;
  watermark_size: WatermarkSize;
  default_user_design: AppDesign;
}

export interface CompanyBranding {
  id: string;
  name: string;
  logo_url: string | null;
  watermark_url: string | null;
  watermark_opacity: number;
  watermark_size: WatermarkSize;
}

export interface Profile {
  id: string; // = auth.users.id
  company_id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface ModulePermission {
  id: string;
  profile_id: string;
  module_key: string;
  can_access: boolean;
}

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: Company;
        Insert: Partial<Company> & { name: string };
        Update: Partial<Company>;
      };
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; company_id: string; email: string };
        Update: Partial<Profile>;
      };
      module_permissions: {
        Row: ModulePermission;
        Insert: Partial<ModulePermission> & { profile_id: string; module_key: string };
        Update: Partial<ModulePermission>;
      };
      company_branding: {
        Row: CompanyBranding;
        Insert: never;
        Update: never;
      };
      employment_types: {
        Row: EmploymentType;
        Insert: Partial<EmploymentType> & { company_id: string; name: string };
        Update: Partial<EmploymentType>;
      };
      employees: {
        Row: Employee;
        Insert: Partial<Employee> & {
          company_id: string;
          first_name: string;
          last_name: string;
          birth_date: string;
          position: string;
          start_date: string;
          employment_type_id: string;
          payment_method: PaymentMethod;
        };
        Update: Partial<Employee>;
      };
      employee_history: {
        Row: EmployeeHistoryEntry;
        Insert: Partial<EmployeeHistoryEntry> & { employee_id: string; change_type: EmployeeChangeType };
        Update: Partial<EmployeeHistoryEntry>;
      };
      pricing_items: {
        Row: PricingItem;
        Insert: Partial<PricingItem> & {
          company_id: string;
          employee_id: string;
          activity_key: PricingActivityKey;
          activity_name: string;
          unit: PricingUnit;
          unit_price: number;
        };
        Update: Partial<PricingItem>;
      };
      pricing_price_history: {
        Row: PricingPriceHistoryEntry;
        Insert: Partial<PricingPriceHistoryEntry> & {
          pricing_item_id: string;
          old_price: number;
          new_price: number;
          new_valid_from: string;
        };
        Update: Partial<PricingPriceHistoryEntry>;
      };
      orders: {
        Row: Order;
        Insert: Partial<Order> & { company_id: string; name: string };
        Update: Partial<Order>;
      };
      order_history: {
        Row: OrderHistoryEntry;
        Insert: Partial<OrderHistoryEntry> & { order_id: string; change_type: OrderChangeType };
        Update: Partial<OrderHistoryEntry>;
      };
      attendance_records: {
        Row: AttendanceRecord;
        Insert: Partial<AttendanceRecord> & { company_id: string; employee_id: string; order_id: string };
        Update: Partial<AttendanceRecord>;
      };
      attendance_work_items: {
        Row: AttendanceWorkItem;
        Insert: Partial<AttendanceWorkItem> & {
          attendance_record_id: string;
          activity_name: string;
          unit: PricingUnit;
          unit_price: number;
          quantity: number;
          total_price: number;
        };
        Update: Partial<AttendanceWorkItem>;
      };
      attendance_history: {
        Row: AttendanceHistoryEntry;
        Insert: Partial<AttendanceHistoryEntry> & { attendance_record_id: string; change_type: AttendanceChangeType };
        Update: Partial<AttendanceHistoryEntry>;
      };
      costs: {
        Row: Cost;
        Insert: Partial<Cost> & {
          company_id: string;
          order_id: string;
          category: CostCategory;
          description: string;
          amount: number;
        };
        Update: Partial<Cost>;
      };
      cost_history: {
        Row: CostHistoryEntry;
        Insert: Partial<CostHistoryEntry> & { cost_id: string; change_type: CostChangeType };
        Update: Partial<CostHistoryEntry>;
      };
      invoicing_records: {
        Row: InvoicingRecord;
        Insert: Partial<InvoicingRecord> & {
          company_id: string;
          order_id: string;
          period_from: string;
          period_to: string;
          invoiced_amount: number;
        };
        Update: Partial<InvoicingRecord>;
      };
      invoicing_history: {
        Row: InvoicingHistoryEntry;
        Insert: Partial<InvoicingHistoryEntry> & { invoicing_record_id: string; change_type: InvoicingChangeType };
        Update: Partial<InvoicingHistoryEntry>;
      };
      construction_log_entries: {
        Row: ConstructionLogEntry;
        Insert: Partial<ConstructionLogEntry> & { company_id: string; order_id: string };
        Update: Partial<ConstructionLogEntry>;
      };
      construction_log_history: {
        Row: ConstructionLogHistoryEntry;
        Insert: Partial<ConstructionLogHistoryEntry> & { entry_id: string; change_type: ConstructionLogChangeType };
        Update: Partial<ConstructionLogHistoryEntry>;
      };
      connections: {
        Row: Connection;
        Insert: Partial<Connection> & { company_id: string; order_id: string; name: string; measurement_method: ConnectionMeasurementMethod };
        Update: Partial<Connection>;
      };
      connection_points: {
        Row: ConnectionPoint;
        Insert: Partial<ConnectionPoint> & { connection_id: string; latitude: number; longitude: number };
        Update: Partial<ConnectionPoint>;
      };
      connection_photos: {
        Row: ConnectionPhoto;
        Insert: Partial<ConnectionPhoto> & { connection_id: string; photo_url: string; photo_path: string };
        Update: Partial<ConnectionPhoto>;
      };
      connection_history: {
        Row: ConnectionHistoryEntry;
        Insert: Partial<ConnectionHistoryEntry> & { connection_id: string; change_type: ConnectionChangeType };
        Update: Partial<ConnectionHistoryEntry>;
      };
      gps_photos: {
        Row: GpsPhoto;
        Insert: Partial<GpsPhoto> & { company_id: string; order_id: string; photo_url: string; photo_path: string };
        Update: Partial<GpsPhoto>;
      };
      gps_photo_history: {
        Row: GpsPhotoHistoryEntry;
        Insert: Partial<GpsPhotoHistoryEntry> & { photo_id: string; change_type: GpsPhotoChangeType };
        Update: Partial<GpsPhotoHistoryEntry>;
      };
      generated_documents: {
        Row: GeneratedDocument;
        Insert: Partial<GeneratedDocument> & {
          company_id: string;
          document_type: DocumentType;
          file_name: string;
          file_url: string;
          file_path: string;
        };
        Update: never;
      };
      user_app_settings: {
        Row: UserAppSettings;
        Insert: Partial<UserAppSettings> & { profile_id: string };
        Update: Partial<UserAppSettings>;
      };
      database_backups: {
        Row: DatabaseBackup;
        Insert: Partial<DatabaseBackup> & { company_id: string };
        Update: Partial<DatabaseBackup>;
      };
      database_restores: {
        Row: DatabaseRestore;
        Insert: Partial<DatabaseRestore> & { company_id: string };
        Update: Partial<DatabaseRestore>;
      };
      paper_forms: {
        Row: PaperForm;
        Insert: Partial<PaperForm> & { company_id: string; form_number: string; month: number; year: number };
        Update: Partial<PaperForm>;
      };
      paper_form_history: {
        Row: PaperFormHistoryEntry;
        Insert: Partial<PaperFormHistoryEntry> & { form_id: string; change_type: PaperFormChangeType };
        Update: Partial<PaperFormHistoryEntry>;
      };
      paper_form_checks: {
        Row: PaperFormCheck;
        Insert: Partial<PaperFormCheck> & { company_id: string; form_id: string; employee_id: string; month: number; year: number };
        Update: Partial<PaperFormCheck>;
      };
      paper_form_check_photos: {
        Row: PaperFormCheckPhoto;
        Insert: Partial<PaperFormCheckPhoto> & { check_id: string; file_path: string; file_type: string };
        Update: Partial<PaperFormCheckPhoto>;
      };
      paper_form_check_history: {
        Row: PaperFormCheckHistoryEntry;
        Insert: Partial<PaperFormCheckHistoryEntry> & { check_id: string; change_type: CheckChangeType };
        Update: Partial<PaperFormCheckHistoryEntry>;
      };
      documents: {
        Row: DocumentV2;
        Insert: Partial<DocumentV2> & { company_id: string; document_type: DocumentTypeV2; category: DocumentCategoryV2; document_number: string; title: string };
        Update: Partial<DocumentV2>;
      };
      document_versions: {
        Row: DocumentVersion;
        Insert: Partial<DocumentVersion> & { document_id: string; version_number: number; content: string };
        Update: Partial<DocumentVersion>;
      };
      document_attachments: {
        Row: DocumentAttachment;
        Insert: Partial<DocumentAttachment> & { document_id: string; file_path: string; file_name: string; file_type: string };
        Update: Partial<DocumentAttachment>;
      };
      document_signatures: {
        Row: DocumentSignature;
        Insert: Partial<DocumentSignature> & { document_id: string; signer_name: string; signer_role: string };
        Update: Partial<DocumentSignature>;
      };
      document_history: {
        Row: DocumentHistoryEntry;
        Insert: Partial<DocumentHistoryEntry> & { document_id: string; change_type: DocumentChangeType };
        Update: Partial<DocumentHistoryEntry>;
      };
    };
    Functions: {
      get_employee_by_share_token: {
        Args: { p_token: string };
        Returns: SharedEmployeeView[];
      };
      create_company_backup: {
        Args: { p_company_id: string };
        Returns: unknown;
      };
      restore_company_backup: {
        Args: { p_company_id: string; p_snapshot: unknown };
        Returns: void;
      };
    };
  };
}
