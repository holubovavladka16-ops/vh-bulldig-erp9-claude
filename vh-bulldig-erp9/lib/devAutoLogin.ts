/**
 * DOČASNÝ testovací bypass přihlášení.
 * Pro vypnutí nastavte DEV_AUTO_LOGIN=false v .env.local.
 */
export function isDevAutoLoginEnabled(): boolean {
  if (process.env.DEV_AUTO_LOGIN === "false") return false;
  return process.env.DEV_AUTO_LOGIN === "true" || process.env.NODE_ENV === "development";
}

export function getDevAdminCredentials() {
  return {
    email: process.env.DEV_ADMIN_EMAIL ?? "",
    password: process.env.DEV_ADMIN_PASSWORD ?? "",
  };
}
