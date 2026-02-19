import { apiFetch } from '@/utils/apiFetch';

import type { SettingsContextValue } from '@/contexts/settings/types';

export const searchSettings = async (
  query: string,
): Promise<SettingsContextValue[]> => {
  if (!query || query.length < 1) return [];

  const res = await apiFetch(
    `/api/settings/search/?q=${encodeURIComponent(query)}`,
  );

  if (!res.ok) {
    let errorMsg = 'Search settings failed';
    try {
      const data = await res.json();
      errorMsg = data.error || errorMsg;
    } catch (e) {
      console.error('Failed to parse settings', e);
    }
    throw new Error(errorMsg);
  }

  return res.json();
};
