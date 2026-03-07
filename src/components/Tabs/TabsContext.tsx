import { useState, useEffect, type ReactNode, startTransition } from 'react';
import { usePageStack } from '@/contexts/useStackHistory';
import { TabsContext, LOCAL_STORAGE_KEY, type TabValue } from './tabsShared';
import { useUser } from '@/contexts/UserContextCore';
import { getLastUserId } from '@/utils/chatStateStorage';

function getTabStorageKey(userId: number | null | undefined): string {
  return userId != null ? `${LOCAL_STORAGE_KEY}-${userId}` : LOCAL_STORAGE_KEY;
}

export function TabsProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const storageKey = getTabStorageKey(user?.id ?? getLastUserId());
  const { push } = usePageStack();
  const [activeTab, setActiveTab] = useState<TabValue>(() => {
    const saved = localStorage.getItem(storageKey) as TabValue | null;
    return saved ?? 'chats';
  });

  useEffect(() => {
    push(activeTab);
  }, [activeTab, push]);

  useEffect(() => {
    localStorage.setItem(storageKey, activeTab);
  }, [activeTab, storageKey]);

  useEffect(() => {
    const next = localStorage.getItem(storageKey) as TabValue | null;
    if (
      next &&
      (next === 'chats' || next === 'contacts' || next === 'profile') &&
      next !== activeTab
    ) {
      startTransition(() => {
        setActiveTab(next);
      });
    }
  }, [storageKey, activeTab]);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
}
