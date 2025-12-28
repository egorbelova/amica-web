import { createContext, useContext, useState, type ReactNode } from 'react';

type TabValue = 'contacts' | 'chats' | 'profile';

interface TabsContextType {
  activeTab: TabValue;
  setActiveTab: (tab: TabValue) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

export function TabsProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabValue>('chats');
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
