const apiOrigin = (): string =>
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

let bootstrapPromise: Promise<void> | null = null;

/**
 * Ensures the server-issued HttpOnly `amica_client_binding_id` cookie exists.
 * The id is never exposed to JS (bootstrap returns only { ok: true }).
 */
export function bootstrapClientBinding(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }
  if (bootstrapPromise) {
    return bootstrapPromise;
  }
  bootstrapPromise = (async () => {
    try {
      await fetch(`${apiOrigin()}/api/client-binding/bootstrap/`, {
        method: 'GET',
        credentials: 'include',
      });
    } catch {
      /* ignore */
    }
  })();
  return bootstrapPromise;
}
