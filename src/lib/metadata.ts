export function canonicalUrl(
  path: string,
  site?: URL | string,
): string | undefined {
  return site ? new URL(path, site).href : undefined;
}
export function pageTitle(title: string, name: string): string {
  return `${title} — ${name} / Software Engineer`;
}
export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
