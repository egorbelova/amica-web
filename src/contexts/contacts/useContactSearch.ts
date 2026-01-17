// contexts/contacts/useContactSearch.ts
import { useSearch } from '@/contexts/search/useSearch';
import { useContacts } from './useContacts';
import type { Contact } from './useContacts';

export function useContactSearch() {
  const { contacts, loading, error, searchContacts } = useContacts();

  const search = useSearch<Contact>({
    searchFn: async (query: string) => searchContacts(query),
    minLength: 1,
  });

  return { ...search, contacts, loading, error };
}
