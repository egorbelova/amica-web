import { useTabs } from './TabsContext';
import { type ReactNode } from 'react';

interface TabProps {
  id: 'contacts' | 'chats' | 'profile';
  children: ReactNode;
}

export function Tab({ id, children }: TabProps) {
  const { activeTab } = useTabs();
  return activeTab === id ? <>{children}</> : null;
}
