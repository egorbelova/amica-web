import { createContext, useContext } from 'react';

export interface SearchReturn<T> {
  term: string;
  setTerm: (v: string) => void;
  results: T[];
  setResults: (v: T[]) => void;
  loading: boolean;
  error: string | null;
  onChange: (value: string) => void;
  clear: () => void;
}

export const SearchContext = createContext<SearchReturn<unknown> | null>(null);

export const useSearchContext = <T>(): SearchReturn<T> => {
  const ctx = useContext(SearchContext) as SearchReturn<T> | null;
  if (!ctx) throw new Error('SearchContext missing');
  return ctx;
};
