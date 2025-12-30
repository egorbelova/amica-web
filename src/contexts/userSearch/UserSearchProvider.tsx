import type { ReactNode } from 'react';
import { UserSearchContext } from './UserSearchContext';
import { useUserSearch } from './useUserSearch';

interface Props {
  children: ReactNode;
}

export const UserSearchProvider = ({ children }: Props) => {
  const value = useUserSearch();

  return (
    <UserSearchContext.Provider value={value}>
      {children}
    </UserSearchContext.Provider>
  );
};
