import { useContext } from 'react';
import Icon from '../Icon/Icon';
import { TabsProvider } from '../Tabs/TabsContext';
import { Tabs } from '../Tabs/Tabs';
import { Tab } from '../Tabs/Tab';
import Contacts from '@/components/Contacts/Contacts';
import Profile from '@/components/Profile/Profile';
import ChatsTabView from './ChatsTabView';
import styles from './LeftSideBar.module.scss';

interface ChooseListProps {
  userInfo?: {
    id: number;
    username: string;
    email: string;
  } | null;
  onLogout?: () => void;
  onRoomSelect?: (roomId: number) => void;
}

const LeftSideBar: React.FC<ChooseListProps> = () => {
  return (
    <div className='choose_list'>
      <TabsProvider>
        <div className='left-menu'>
          <Tab id='contacts'>
            <div className={styles['tab-content']}>{/* <Contacts /> */}</div>
          </Tab>
          <Tab id='chats'>
            {/* <div className='chat-list-title'>Messages</div> */}
            <ChatsTabView />
          </Tab>
          <Tab id='profile'>
            <div className={styles['tab-content']}>
              <Profile />
            </div>
          </Tab>
        </div>
        <Tabs />
      </TabsProvider>
    </div>
  );
};

export default LeftSideBar;
