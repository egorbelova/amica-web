import { apiFetch } from '@/utils/apiFetch';

export async function deleteDisplayMediaById(
  mediaId: string | number,
): Promise<void> {
  const res = await apiFetch(
    `/api/media_files/primary-media/${encodeURIComponent(String(mediaId))}/`,
    { method: 'DELETE' },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
}
