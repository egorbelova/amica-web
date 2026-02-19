import { createContext, useContext } from 'react';

export type TabValue = 'contacts' | 'chats' | 'profile';

export interface TabsContextType {
  activeTab: TabValue;
  setActiveTab: (tab: TabValue) => void;
}

export const TabsContext = createContext<TabsContextType | null>(null);

export const LOCAL_STORAGE_KEY = 'activeTab';

export const useTabs = () => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('useTabs must be used within TabsProvider');
  return context;
};
