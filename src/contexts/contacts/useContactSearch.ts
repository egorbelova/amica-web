// contexts/contacts/useContactSearch.ts
import { useSearch } from '@/contexts/search/useSearch';
import { useContacts } from './useContacts';
import type { Contact } from './useContacts';

export function useContactSearch() {
  const { contacts, loading, error, searchContacts } = useContacts();

  // Используем useSearch, но передаем локальную функцию
  const search = useSearch<Contact>({
    searchFn: async (query: string) => searchContacts(query),
    minLength: 1, // Поиск даже при 1 символе
  });

  return { ...search, contacts, loading, error };
}
