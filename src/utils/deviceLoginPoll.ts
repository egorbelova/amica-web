/** Same origin as apiFetch/login so HttpOnly `amica_client_binding_id` is sent (critical for Safari). */
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function pollDeviceLoginUntilReady(
  challengeId: string,
  options?: { intervalMs?: number; timeoutMs?: number },
): Promise<{ access: string; user: unknown; backup_codes?: string[] }> {
  const intervalMs = options?.intervalMs ?? 2000;
  const timeoutMs = options?.timeoutMs ?? 600_000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const res = await fetch(
      `${API_BASE_URL}/api/device-login/poll/${challengeId}/`,
      {
        method: 'GET',
        credentials: 'include',
      },
    );
    const data = (await res.json()) as {
      status?: string;
      access?: string;
      user?: unknown;
      backup_codes?: string[];
      error?: string;
    };

    if (res.ok && data.status === 'ok' && data.access) {
      return {
        access: data.access,
        user: data.user,
        backup_codes: data.backup_codes,
      };
    }
    if (res.ok && data.status === 'rejected') {
      throw new Error('DEVICE_LOGIN_REJECTED');
    }
    if (res.status === 410 || data.status === 'expired') {
      throw new Error('Device confirmation expired');
    }
    if (res.status === 403) {
      throw new Error('Wrong client');
    }
    if (res.status === 404) {
      throw new Error('Challenge not found');
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error('Device confirmation timed out');
}
