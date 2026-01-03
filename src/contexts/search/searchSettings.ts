// contexts/search/searchSettings.ts
import { apiFetch } from '@/utils/apiFetch';
import type { Setting } from '@/types'; // Тип для настроек

export const searchSettings = async (query: string): Promise<Setting[]> => {
  if (!query || query.length < 1) return [];

  const res = await apiFetch(
    `/api/settings/search/?q=${encodeURIComponent(query)}`
  );

  if (!res.ok) {
    let errorMsg = 'Search settings failed';
    try {
      const data = await res.json();
      errorMsg = data.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  return res.json();
};
