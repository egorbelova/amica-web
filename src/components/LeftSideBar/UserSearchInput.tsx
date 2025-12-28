import { useCallback, useRef, useState } from 'react';
import { Icon } from '../Icons/AutoIcons';
import styles from './UserSearchInput.module.scss';
import './UserSearchInput.css';
import { apiFetch } from '@/utils/apiFetch';

interface User {
  id: number;
  email: string;
  username: string | null;
  display_name: string;
}

const UserSearchInput = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
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

  const handleSearchClear = useCallback(() => {
    setSearchTerm('');
    setResults([]);
    setError(null);
  }, []);

  return (
    <div className='search_div' id='search'>
      <div className='liquidGlass-effect'></div>
      <div className='liquidGlass-tint'></div>
      <div className='liquidGlass-shine'></div>
      <div className='search_field_div'>
        <div className='search_icon_div'>
          {/* <Icon name='search-icon' className='search_icon' /> */}
        </div>
        <div className='search_field_input'>
          <input
            aria-label='Search'
            className='search_field'
            name='term'
            placeholder=' '
            value={searchTerm}
            onChange={handleSearchChange}
            ref={searchInputRef}
          />
          <span className='search_field_placeholder'>Search</span>
        </div>
      </div>
      <div className='search_cross_div' onClick={handleSearchClear}>
        <svg className='search_cross'>
          <use href='#cross-icon'></use>
        </svg>
      </div>

      {loading && <div className='search_loading'>Loading...</div>}
      {error && <div className='search_error'>{error}</div>}
      {results.length > 0 && (
        <ul className='search_results'>
          {results.map((user) => (
            <li key={user.id}>
              {user.display_name} ({user.email})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserSearchInput;
