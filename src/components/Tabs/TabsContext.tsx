import { useState, useEffect, type ReactNode } from 'react';
import { usePageStack } from '@/contexts/useStackHistory';
import { TabsContext, LOCAL_STORAGE_KEY, type TabValue } from './tabsShared';

export function TabsProvider({ children }: { children: ReactNode }) {
  const { push } = usePageStack();

  const [activeTab, setActiveTab] = useState<TabValue>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY) as TabValue | null;
    return saved ?? 'chats';
  });

  useEffect(() => {
    push(activeTab);
  }, [activeTab, push]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, activeTab);
  }, [activeTab]);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
}
