const STORAGE_KEY = 'amica_client_binding';

const apiOrigin = (): string =>
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

/** Stable id for this browser profile; synced with server HttpOnly cookie via bootstrap. */
export function getClientBindingId(): string {
  if (typeof window === 'undefined' || !window.localStorage) return '';
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}

let bootstrapPromise: Promise<string> | null = null;

/**
 * Ensures the server-issued HttpOnly binding cookie exists and aligns localStorage
 * (used for WebSocket `client_binding` query) with that id.
 */
export function bootstrapClientBinding(): Promise<string> {
  if (typeof window === 'undefined') {
    return Promise.resolve('');
  }
  if (bootstrapPromise) {
    return bootstrapPromise;
  }
  bootstrapPromise = (async () => {
    try {
      const res = await fetch(`${apiOrigin()}/api/client-binding/bootstrap/`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = (await res.json()) as { client_binding_id?: string };
      if (data.client_binding_id) {
        try {
          localStorage.setItem(STORAGE_KEY, data.client_binding_id);
        } catch {
          /* ignore */
        }
        return data.client_binding_id;
      }
    } catch {
      /* ignore */
    }
    return getClientBindingId();
  })();
  return bootstrapPromise;
}

/** Headers for credentialed requests (refresh, login, etc.). */
export function clientBindingHeaders(): Record<string, string> {
  const id = getClientBindingId();
  return id ? { 'X-Client-Binding': id } : {};
}
