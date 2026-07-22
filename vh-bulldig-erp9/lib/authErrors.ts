/**
 * Překlad technických chyb Supabase na povinné české uživatelské zprávy.
 * Uživatel nikdy nesmí vidět technickou hlášku Supabase (viz zadání bod 12).
 */
export function toCzechAuthError(rawMessage: string | undefined): string {
  const msg = (rawMessage ?? "").toLowerCase();

  if (msg.includes("invalid login credentials")) {
    return "Nesprávný e-mail nebo heslo.";
  }
  if (msg.includes("email not confirmed")) {
    return "Tento účet není aktivní.";
  }
  if (msg.includes("user is disabled") || msg.includes("banned")) {
    return "Tento účet není aktivní.";
  }
  if (msg.includes("oauth") || msg.includes("google")) {
    return "Přihlášení přes Google se nepodařilo.";
  }
  if (
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("timeout")
  ) {
    return "Připojení k serveru se nezdařilo.";
  }
  if (msg.includes("session") || msg.includes("expired") || msg.includes("jwt")) {
    return "Vaše relace vypršela. Přihlaste se znovu.";
  }

  return "Přihlášení se nezdařilo. Zkuste to prosím znovu.";
}

export const NO_PERMISSION_MESSAGE = "Nemáte oprávnění ke vstupu do aplikace.";
