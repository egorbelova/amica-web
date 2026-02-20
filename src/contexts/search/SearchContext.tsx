// contexts/search/SearchContext.tsx
import { type ReactNode } from 'react';
import { useSearch } from './useSearch';
import { SearchContext } from './SearchContextCore';

interface SearchProviderProps<T> {
  searchFn: (query: string) => Promise<T[]>;
  children: ReactNode;
  minLength?: number;
  debounceMs?: number;
}

export function SearchProvider<T>({
  searchFn,
  children,
  minLength,
  debounceMs,
}: SearchProviderProps<T>) {
  const search = useSearch<T>({ searchFn, minLength, debounceMs });
  return (
    <SearchContext.Provider value={search}>{children}</SearchContext.Provider>
  );
}
