// UserSearchContext.ts
import { createContext } from 'react';

export interface User {
  id: number;
  email: string;
  username: string | null;
  display_name: string;
  profile?: {
    primary_avatar?: string | null;
  };
}

export interface UserSearchContextValue {
  searchTerm: string;
  results: User[];
  loading: boolean;
  error: string | null;
  onChange: (value: string) => void;
  clear: () => void;
}

export const UserSearchContext = createContext<UserSearchContextValue | null>(
  null
);
