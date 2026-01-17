// components/Search/UserSearch.tsx
import React from 'react';
import { SearchProvider } from '@/contexts/search/SearchContext';
import SearchInput from '@/components/ui/searchInput/SearchInput';
import GlobalSearchList from '@/components/GlobalSearchList/GlobalSearchList';
//@ts-ignore
import { searchUsers } from '@/contexts/search/searchUsers';
import ChatList from '@/components/ChatList/ChatList';

const ProfileTabView: React.FC = () => {
  return (
    <SearchProvider searchFn={searchUsers}>
      <SearchInput placeholder='Search...' />
      <ChatList />
      <GlobalSearchList />
    </SearchProvider>
  );
};

export default ProfileTabView;
