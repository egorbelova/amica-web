import { apiFetch } from '@/utils/apiFetch';
import type { Contact } from '@/types';

export const searchContacts = async (query: string): Promise<Contact[]> => {
  if (!query || query.length < 1) return [];

  const res = await apiFetch(
    `/api/contacts/search/?q=${encodeURIComponent(query)}`,
  );

  if (!res.ok) {
    let errorMsg = 'Search contacts failed';
    try {
      const data = await res.json();
      errorMsg = data.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  return res.json();
};
