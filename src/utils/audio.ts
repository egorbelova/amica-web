import { apiFetch } from '@/utils/apiFetch';
import { getAccessTokenOrThrow, refreshTokenIfNeeded } from '@/utils/authStore';

export async function fetchPrivateMedia(url: string) {
  const res = await apiFetch(url);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function getSignedMediaUrl(url: string): Promise<string> {
  await refreshTokenIfNeeded();
  const token = await getAccessTokenOrThrow();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}token=${encodeURIComponent(token)}`;
}
