import { useTabs } from './tabsShared';
import { type ReactNode } from 'react';
import styles from './Tabs.module.scss';

interface TabProps {
  id: 'contacts' | 'chats' | 'profile';
  children: ReactNode;
}

export function Tab({ id, children }: TabProps) {
  const { activeTab } = useTabs();

  const isActive = activeTab === id;

  return (
    <div
      className={`${styles['tab-view']} ${
        isActive ? styles['tab-view--active'] : ''
      }`}
      aria-hidden={!isActive}
      inert={!isActive ? true : undefined}
    >
      {children}
    </div>
  );
}
