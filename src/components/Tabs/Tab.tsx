import { useTabs } from './tabsShared';
import { type ReactNode } from 'react';
import styles from './Tabs.module.scss';

interface TabProps {
  id: 'contacts' | 'chats' | 'profile';
  children: ReactNode;
}

export function Tab({ id, children }: TabProps) {
  const { activeTab } = useTabs();

  return (
    <div
      className={`${styles['tab-view']} ${
        activeTab === id ? styles['tab-view--active'] : ''
      }`}
    >
      {children}
    </div>
  );
}
