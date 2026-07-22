import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDevAutoLoginEnabled } from "@/lib/devAutoLogin";

export default async function RootPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  if (isDevAutoLoginEnabled()) {
    redirect("/api/dev/auto-login?next=/dashboard");
  }

  redirect("/prihlaseni");
}
