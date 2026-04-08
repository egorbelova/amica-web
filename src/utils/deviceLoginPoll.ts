import { clientBindingHeaders } from './clientBinding';

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function pollDeviceLoginUntilReady(
  challengeId: string,
  options?: { intervalMs?: number; timeoutMs?: number },
): Promise<{ access: string; user: unknown }> {
  const intervalMs = options?.intervalMs ?? 2000;
  const timeoutMs = options?.timeoutMs ?? 600_000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const res = await fetch(
      `${API_BASE}/api/device-login/poll/${challengeId}/`,
      {
        method: 'GET',
        credentials: 'include',
        headers: clientBindingHeaders(),
      },
    );
    const data = (await res.json()) as {
      status?: string;
      access?: string;
      user?: unknown;
      error?: string;
    };

    if (res.ok && data.status === 'ok' && data.access) {
      return { access: data.access, user: data.user };
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
