export type TokenListener = (token: string | null) => void;
export type UnauthorizedListener = () => void;

const HEARTBEAT_INTERVAL = 300_000;

let accessToken: string | null = null;
let accessTokenExp: number | null = null;

const tokenListeners = new Set<TokenListener>();
const unauthorizedListeners = new Set<UnauthorizedListener>();

let refreshPromise: Promise<void> | null = null;
let heartbeatId: number | null = null;

function decodeJwtExp(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    let payloadStr = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    switch (payloadStr.length % 4) {
      case 2:
        payloadStr += '==';
        break;
      case 3:
        payloadStr += '=';
        break;
    }

    const payload = JSON.parse(atob(payloadStr));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isTokenExpired(): boolean {
  return (
    !accessToken || !accessTokenExp || Date.now() > accessTokenExp - 120_000
  );
}

function notifyTokenChange(token: string | null) {
  tokenListeners.forEach((l) => {
    try {
      l(token);
    } catch (e) {
      console.error('[authStore] token listener error', e);
    }
  });
}

function notifyUnauthorized() {
  unauthorizedListeners.forEach((l) => {
    try {
      l();
    } catch (e) {
      console.error('[authStore] unauthorized listener error', e);
    }
  });
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  accessTokenExp = token ? decodeJwtExp(token) : null;
  notifyTokenChange(token);
}

/** Set refresh_token cookie (e.g. after WS login/signup). Cannot set httponly from JS. */
export function setRefreshCookie(refreshToken: string, maxAgeDays = 7): void {
  const maxAge = maxAgeDays * 24 * 60 * 60;
  document.cookie = `refresh_token=${encodeURIComponent(refreshToken)}; path=/; max-age=${maxAge}; samesite=Lax${location.protocol === 'https:' ? '; secure' : ''}`;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export async function getAccessTokenOrThrow(): Promise<string> {
  await refreshTokenIfNeeded();
  if (!accessToken) throw new Error('No access token');
  return accessToken;
}

export function onAccessTokenChange(listener: TokenListener) {
  tokenListeners.add(listener);
  return () => tokenListeners.delete(listener);
}

export function onUnauthorized(listener: UnauthorizedListener) {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

export type RefreshTokenFn = () => Promise<void>;
let customRefreshTokenFn: RefreshTokenFn | null = null;

export function setCustomRefreshTokenFn(fn: RefreshTokenFn | null) {
  customRefreshTokenFn = fn;
}

/** Only used for bootstrap when there is no access token in memory (e.g. after reload with refresh cookie). All other refresh is done via WebSocket. */
async function refreshTokenViaHttp(): Promise<void> {
  const res = await fetch('/api/refresh_token/', {
    method: 'POST',
    credentials: 'include',
  });

  if (res.status === 401) {
    setAccessToken(null);
    notifyUnauthorized();
    throw new Error('Unauthorized');
  }

  if (!res.ok) throw new Error('Refresh failed');

  const data = await res.json();
  setAccessToken(data.access);
}

export { refreshTokenViaHttp };

async function refreshToken(): Promise<void> {
  if (customRefreshTokenFn) {
    await customRefreshTokenFn();
    return;
  }
  await refreshTokenViaHttp();
}

export async function refreshTokenIfNeeded(): Promise<void> {
  if (!isTokenExpired()) return;

  if (!refreshPromise) {
    refreshPromise = refreshToken().finally(() => {
      refreshPromise = null;
    });
  }

  await refreshPromise;
  if (!accessToken) throw new Error('No valid token after refresh');
}

export function startAuthHeartbeat(intervalMs = HEARTBEAT_INTERVAL) {
  if (heartbeatId !== null) return;

  heartbeatId = window.setInterval(async () => {
    if (!accessToken || !navigator.onLine) return;
    try {
      await refreshTokenIfNeeded();
    } catch (e) {
      console.error('Failed to refresh token', e);
    }
  }, intervalMs);
}

export function stopAuthHeartbeat() {
  if (heartbeatId !== null) {
    clearInterval(heartbeatId);
    heartbeatId = null;
  }
}

export function initAuth() {
  startAuthHeartbeat();
}

export function logout() {
  setAccessToken(null);
  stopAuthHeartbeat();
  notifyUnauthorized();
}

export function handleUnauthorized() {
  setAccessToken(null);
  stopAuthHeartbeat();
  notifyUnauthorized();
}
