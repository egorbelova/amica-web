// useUserSearch.ts
import { useCallback, useRef, useState } from 'react';
import { apiFetch } from '@/utils/apiFetch';
import { type User } from './UserSearchContext';

export const useUserSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async (value: string) => {
    if (value.length < 4) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch(
        `/api/users/search/?email=${encodeURIComponent(value)}`
      );

      if (!response.ok) {
        let errorMsg = 'Unknown error';
        try {
          const errData = await response.json();
          errorMsg = errData.error || errorMsg;
        } catch {
          errorMsg = await response.text();
        }
        throw new Error(errorMsg);
      }

      const data: User[] = await response.json();
      setResults(data);
    } catch (err: any) {
      setResults([]);
      setError(err.message ?? 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const onChange = useCallback(
    (value: string) => {
      setSearchTerm(value);

      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      debounceTimeout.current = setTimeout(() => {
        fetchUsers(value);
      }, 300);
    },
    [fetchUsers]
  );

  const clear = useCallback(() => {
    setSearchTerm('');
    setResults([]);
    setError(null);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
  }, []);

  return {
    searchTerm,
    results,
    loading,
    error,
    onChange,
    clear,
  };
};
