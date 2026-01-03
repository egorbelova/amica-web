// api.ts
import {
  getAccessTokenOrThrow,
  refreshTokenIfNeeded,
  handleUnauthorized,
} from './authStore';

export interface ApiError extends Error {
  status?: number;
  data?: any;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

let onUnauthorizedHandler: (() => void) | null = null;

/**
 * Позволяет UI подписаться на событие 401 из API
 */
export const setApiFetchUnauthorizedHandler = (callback: () => void) => {
  onUnauthorizedHandler = callback;
};

// =======================
// Utils
// =======================

async function retry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 500
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    const jitter = Math.random() * 100;
    await new Promise((r) => setTimeout(r, delay + jitter));
    return retry(fn, retries - 1, delay * 2);
  }
}

function logFetchError(err: any, url: string) {
  console.error('[apiFetch error]', url, err);
}

async function fetchWithRetry(
  url: string,
  options: RequestInit
): Promise<Response> {
  return retry(() => fetch(url, options), 3, 500);
}

// =======================
// API Fetch
// =======================

export async function apiFetch(
  url: string,
  options: RequestInit = {},
  retried401 = false
): Promise<Response> {
  let token: string | null = null;

  try {
    await refreshTokenIfNeeded();
    token = await getAccessTokenOrThrow();
  } catch {
    token = null; // продолжаем без токена
  }

  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const isFormData = options.body instanceof FormData;
  if (isFormData) headers.delete('Content-Type');

  const response = await fetchWithRetry(`${API_BASE_URL}${url}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  // Retry один раз при 401
  if (response.status === 401 && !retried401) {
    try {
      await refreshTokenIfNeeded();
      const newToken = await getAccessTokenOrThrow();
      const newHeaders = new Headers(options.headers || {});
      if (newToken) newHeaders.set('Authorization', `Bearer ${newToken}`);
      if (isFormData) newHeaders.delete('Content-Type');

      return apiFetch(
        url,
        { ...options, credentials: 'include', headers: newHeaders },
        true
      );
    } catch (err) {
      logFetchError('Retry after 401 failed', url);
    }
  }

  if (response.status === 401) {
    onUnauthorizedHandler?.();
    handleUnauthorized();
  }

  return response;
}

// =======================
// JSON helper
// =======================

export async function apiJson<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await apiFetch(url, { ...options, credentials: 'include' });

  let data: any;
  const contentType = res.headers.get('content-type') || '';

  try {
    data = contentType.includes('application/json')
      ? await res.json()
      : await res.text();
  } catch {
    data = await res.text();
  }

  if (!res.ok) {
    const err: ApiError = new Error(
      (data as any)?.error ||
        (data as any)?.detail ||
        (data as string) ||
        res.statusText
    ) as ApiError;
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

// =======================
// File upload helper
// =======================

export async function apiUpload(
  url: string,
  formData: FormData,
  onProgress?: (percent: number) => void
): Promise<any> {
  const token = await getCurrentToken();
  if (!token) throw new Error('No access token');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}${url}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.withCredentials = true;

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status === 401) {
        onUnauthorizedHandler?.();
        reject(new Error('Unauthorized'));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve(xhr.responseText);
        }
      } else {
        reject(xhr.responseText || 'Upload failed');
      }
    };

    xhr.onerror = () => reject(new Error('Network error'));
    xhr.ontimeout = () => reject(new Error('Timeout'));

    xhr.send(formData);
  });
}

async function getCurrentToken(): Promise<string | null> {
  try {
    await refreshTokenIfNeeded();
    return await getAccessTokenOrThrow();
  } catch {
    return null;
  }
}
