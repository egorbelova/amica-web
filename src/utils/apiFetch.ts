export interface ApiError extends Error {
  status?: number;
  data?: any;
}

let onUnauthorized: (() => void) | null = null;
export const setApiFetchUnauthorizedHandler = (callback: () => void) => {
  onUnauthorized = callback;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const HEARTBEAT_INTERVAL = 300_000;

let accessToken: string | null = null;
let accessTokenExp: number | null = null;

function decodeJwtExp(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadStr = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadStr);
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  accessTokenExp = token ? decodeJwtExp(token) : null;
};

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

function isTokenExpired(): boolean {
  return (
    !accessToken || !accessTokenExp || Date.now() > accessTokenExp - 120_000
  );
}

let refreshPromise: Promise<void> | null = null;

async function refreshToken(): Promise<void> {
  const res = await fetch('/api/refresh_token/', {
    method: 'POST',
    credentials: 'include',
  });

  if (res.status === 401) {
    accessToken = null;
    accessTokenExp = null;
    onUnauthorized?.();
    throw new Error('Unauthorized');
  }

  if (!res.ok) throw new Error('Server error');

  const data = await res.json();
  if (data.refresh) setAccessToken(data.refresh);
  setAccessToken(data.access);
}

async function refreshTokenIfNeeded(): Promise<string> {
  if (!isTokenExpired()) return accessToken!;

  if (!refreshPromise) {
    refreshPromise = retry(refreshToken).finally(() => {
      refreshPromise = null;
    });
  }

  await refreshPromise;
  if (!accessToken) throw new Error('No valid token');

  return accessToken;
}

let heartbeatId: number | null = null;
export function startRefreshHeartbeat(intervalMs = HEARTBEAT_INTERVAL) {
  if (heartbeatId !== null) return;

  heartbeatId = window.setInterval(async () => {
    if (!accessToken || !navigator.onLine) return;
    try {
      await refreshTokenIfNeeded();
    } catch {}
  }, intervalMs) as unknown as number;
}

export function stopRefreshHeartbeat() {
  if (heartbeatId !== null) {
    window.clearInterval(heartbeatId);
    heartbeatId = null;
  }
}

export async function getAccessTokenOrThrow(): Promise<string> {
  return refreshTokenIfNeeded();
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 2
): Promise<Response> {
  return retry(async () => {
    const res = await fetch(url, options);
    if (!res.ok && res.status >= 500) throw res;
    return res;
  }, retries);
}

export async function apiFetch(
  url: string,
  options: RequestInit = {},
  retried401 = false
): Promise<Response> {
  const isFormData = options.body instanceof FormData;
  let token: string | null = null;

  if (!isFormData) {
    if (accessToken && !isTokenExpired()) {
      token = accessToken;
    } else {
      try {
        token = await refreshTokenIfNeeded();
      } catch {
        return new Response(null, { status: 401 });
      }
    }
  }

  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetchWithRetry(url, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (response.status === 401 && !retried401 && !isFormData) {
    try {
      const newToken = await refreshTokenIfNeeded();
      const newHeaders = new Headers(options.headers || {});
      newHeaders.set('Authorization', `Bearer ${newToken}`);

      return await apiFetch(
        url,
        {
          ...options,
          credentials: 'include',
          headers: newHeaders,
        },
        true
      );
    } catch {
      logFetchError('Retry failed', url);
    }
  }

  if (response.status === 401) {
    onUnauthorized?.();
  }

  return response;
}

export async function apiJson<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await apiFetch(url, {
    ...options,
    credentials: 'include',
  });
  const contentType = res.headers.get('content-type') || '';

  const data = contentType.includes('application/json')
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    const err: ApiError = new Error(
      (data as any)?.error || (data as any)?.detail || res.statusText
    ) as ApiError;
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

export async function initAuth(): Promise<void> {
  startRefreshHeartbeat();
}

export function cleanupAuth() {
  stopRefreshHeartbeat();
}

export async function apiUpload(
  url: string,
  formData: FormData,
  onProgress?: (percent: number) => void
): Promise<any> {
  const token = await getAccessTokenOrThrow();

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 401) {
        onUnauthorized?.();
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(xhr.responseText);
      }
    };

    xhr.onerror = () => reject('Network error');

    xhr.send(formData);
  });
}
