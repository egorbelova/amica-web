import { useState, useRef, useCallback } from 'react';
import Icon from '../Icon/Icon';
import { TabsProvider } from '../Tabs/TabsContext';
import { Tabs } from '../Tabs/Tabs';
import { Tab } from '../Tabs/Tab';
import Contacts from '@/components/Contacts/Contacts';
import ChatList from '@/components/ChatList/ChatList';
import Profile from '@/components/Profile/Profile';
import UserSearchInput from './UserSearchInput';

interface ChooseListProps {
  userInfo?: {
    id: number;
    username: string;
    email: string;
  } | null;
  onLogout?: () => void;
  onRoomSelect?: (roomId: number) => void;
}

const LeftSideBar: React.FC<ChooseListProps> = ({ onLogout, onRoomSelect }) => {
  return (
    <div className='choose_list'>
      <div className='chat-list-title'>Messages</div>
      <UserSearchInput />
      <TabsProvider>
        <div className='left-menu'>
          <div className='shadow-header'></div>
          <Tab id='contacts'>
            <Contacts />
          </Tab>
          <Tab id='chats'>
            <ChatList />
          </Tab>
          <Tab id='profile'>
            <Profile />
          </Tab>
        </div>
        <Tabs />
      </TabsProvider>
    </div>
  );
};

export default LeftSideBar;
