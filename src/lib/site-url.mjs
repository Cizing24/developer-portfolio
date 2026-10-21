/** Reject accidental placeholder, local, or non-HTTPS production identities. */
export function resolveSiteUrl(value) {
  if (!value?.trim()) return undefined;
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/' ||
    /^(localhost|127\.|example\.|.*\.example$)/.test(url.hostname)
  ) {
    throw new Error(
      'SITE_URL must be a real HTTPS origin without a path, credentials, query, or fragment.',
    );
  }
  return url.origin;
}
