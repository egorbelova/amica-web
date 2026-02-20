import { apiFetch } from '@/utils/apiFetch';
import type { User } from '../types';

export const searchGlobal = async (query: string): Promise<User[]> => {
  const res = await apiFetch(
    `/api/users/search/?email=${encodeURIComponent(query)}`,
  );
  if (!res.ok) throw new Error('Search failed');
  return res.json();
};
