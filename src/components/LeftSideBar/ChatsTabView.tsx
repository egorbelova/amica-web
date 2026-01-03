// components/Search/UserSearch.tsx
import React from 'react';
import { SearchProvider } from '@/contexts/search/SearchContext';
import SearchInput from '@/components/ui/searchInput/SearchInput';
import GlobalSearchList from '@/components/GlobalSearchList/GlobalSearchList';
import { searchGlobal } from '@/contexts/search/searchGlobal';
import ChatList from '@/components/ChatList/ChatList';
import styles from './LeftSideBar.module.scss';

const ChatsTabView: React.FC = () => {
  return (
    <SearchProvider searchFn={searchGlobal}>
      <SearchInput placeholder='Search' />
      <div className={styles['tab-content']}>
        <ChatList />
        <GlobalSearchList />
      </div>
    </SearchProvider>
  );
};

export default ChatsTabView;
