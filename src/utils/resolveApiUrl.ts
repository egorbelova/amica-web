const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(
  /\/$/,
  '',
) ?? '';

/**
 * URL for browser or fetch against the API.
 * - Absolute http(s) URLs are returned unchanged.
 * - Relative paths get `VITE_API_URL` prepended so `<video src>` and `fetch` hit the backend
 *   (WS messages often ship relative `/api/protected-file/...` without an HTTP request).
 */
export function resolveApiUrl(url: string | null | undefined): string {
  const s = (url ?? '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  const path = s.startsWith('/') ? s : `/${s}`;
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}
