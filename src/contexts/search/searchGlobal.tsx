import { SearchProvider } from './SearchContext';
import SearchInput from '@/components/ui/searchInput/SearchInput';
import { apiFetch } from '@/utils/apiFetch';
//@ts-ignore
import type { User } from '@/contexts/UserContext';
import GlobalSearchList from '@/components/GlobalSearchList/GlobalSearchList';

<>
  <SearchInput placeholder='Search users...' />
  <GlobalSearchList />
</>;
