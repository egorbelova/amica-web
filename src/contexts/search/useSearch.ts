// contexts/search/useSearch.ts
import { useCallback, useRef, useState } from 'react';

interface UseSearchOptions<T> {
  searchFn: (query: string) => Promise<T[]>;
  minLength?: number;
  debounceMs?: number;
}

export function useSearch<T>({
  searchFn,
  minLength = 4,
  debounceMs = 300,
}: UseSearchOptions<T>) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const execute = useCallback(
    async (value: string) => {
      if (value.length < minLength) {
        setResults([]);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await searchFn(value);
        setResults(data);
      } catch (e: any) {
        setResults([]);
        setError(e.message ?? 'Search failed');
      } finally {
        setLoading(false);
      }
    },
    [searchFn, minLength]
  );

  const onChange = useCallback(
    (value: string) => {
      setTerm(value);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => execute(value), debounceMs);
    },
    [execute, debounceMs]
  );

  const clear = useCallback(() => {
    setTerm('');
    setResults([]);
    setError(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return {
    term,
    setTerm,
    results,
    setResults,
    loading,
    error,
    onChange,
    clear,
  };
}
