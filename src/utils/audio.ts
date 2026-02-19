import { apiFetch } from '@/utils/apiFetch';

export async function fetchPrivateMedia(url: string) {
  const res = await apiFetch(url);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
