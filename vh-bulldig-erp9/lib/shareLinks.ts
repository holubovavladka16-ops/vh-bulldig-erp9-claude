export function buildShareUrl(token: string, siteUrl: string): string {
  return `${siteUrl}/sdileny/${token}`;
}

export function buildWhatsAppShareUrl(link: string, employeeName: string): string {
  const text = encodeURIComponent(`Odkaz na váš zaměstnanecký formulář (${employeeName}): ${link}`);
  return `https://wa.me/?text=${text}`;
}

export function buildMessengerShareUrl(link: string): string {
  return `https://www.facebook.com/dialog/send?link=${encodeURIComponent(link)}&app_id=0&redirect_uri=${encodeURIComponent(link)}`;
}

export function buildMailtoShareUrl(link: string, employeeName: string): string {
  const subject = encodeURIComponent(`Váš zaměstnanecký formulář – ${employeeName}`);
  const body = encodeURIComponent(`Dobrý den,\n\nzde je odkaz na váš zaměstnanecký formulář:\n${link}\n`);
  return `mailto:?subject=${subject}&body=${body}`;
}
