import { SearchProvider } from './SearchContext';
import SearchInput from '@/components/ui/searchInput/SearchInput';
import { apiFetch } from '@/utils/apiFetch';
import type { User } from '@/contexts/UserContext';
import GlobalSearchList from '@/components/GlobalSearchList/GlobalSearchList';

export const searchGlobal = async (query: string): Promise<User[]> => {
  const res = await apiFetch(
    `/api/users/search/?email=${encodeURIComponent(query)}`
  );
  if (!res.ok) throw new Error('Search failed');
  return res.json();
};

<SearchProvider searchFn={searchGlobal}>
  <SearchInput placeholder='Search users...' />
  <GlobalSearchList />
</SearchProvider>;
