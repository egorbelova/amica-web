import { apiFetch } from '@/utils/apiFetch';
import type { User } from '@/types';
import type { GlobalSearchItem } from '@/contexts/search/globalSearchTypes';

export const searchGlobal = async (query: string): Promise<User[]> => {
  const res = await apiFetch(
    `/api/users/search/?email=${encodeURIComponent(query)}`,
  );
  if (!res.ok) throw new Error('Search failed');
  return res.json();
};

/** For Chats tab: search users only, return as GlobalSearchItem[] */
export const searchChatsTab = async (
  query: string,
): Promise<GlobalSearchItem[]> => {
  const users = await searchGlobal(query);
  return users.map((user): GlobalSearchItem => ({ type: 'user', data: user }));
};
