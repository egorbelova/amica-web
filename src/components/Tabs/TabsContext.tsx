import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { usePageStack } from '@/contexts/useStackHistory';

type TabValue = 'contacts' | 'chats' | 'profile';

interface TabsContextType {
  activeTab: TabValue;
  setActiveTab: (tab: TabValue) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

const LOCAL_STORAGE_KEY = 'activeTab';

export function TabsProvider({ children }: { children: ReactNode }) {
  const { push } = usePageStack();

  const [activeTab, setActiveTab] = useState<TabValue>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY) as TabValue | null;
    return saved ?? 'chats';
  });

  useEffect(() => {
    push(activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, activeTab);
  }, [activeTab]);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
}

export const useTabs = () => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('useTabs must be used within TabsProvider');
  return context;
};
