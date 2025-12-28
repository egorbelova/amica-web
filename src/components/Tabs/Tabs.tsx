import { useTabs } from './TabsContext';
import { useUser } from '@/contexts/UserContext';
import { Icon } from '@/components/Icons/AutoIcons';
import Avatar from '@/components/Avatar/Avatar';
import styles from './Tabs.module.scss';
import { useTranslation } from '@/contexts/LanguageContext';

type TabValue = 'contacts' | 'chats' | 'profile';

type TabConfig = {
  id: TabValue;
  label: string;
  icon?: React.ReactNode;
  avatar?: boolean;
};

export function Tabs() {
  const { activeTab, setActiveTab } = useTabs();
  const { user } = useUser();
  const { t } = useTranslation();

  const tabs: TabConfig[] = [
    {
      id: 'contacts',
      label: t('tabs.contacts'),
      icon: <Icon name='ContactHeart' />,
    },
    { id: 'chats', label: t('tabs.chats'), icon: <Icon name='Chats' /> },
    { id: 'profile', label: t('tabs.profile'), avatar: true },
  ];

  return (
    <nav className={styles.tabs}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`${styles.tab} ${
            activeTab === tab.id ? styles.active : ''
          }`}
          onClick={() => setActiveTab(tab.id)}
          type='button'
        >
          {tab.icon && !tab.avatar && (
            <div className={styles.icon}>{tab.icon}</div>
          )}

          {tab.avatar && user?.profile?.primary_avatar && (
            <div className={styles.avatar}>
              <Avatar
                displayName={user.username}
                displayMedia={user.profile.primary_avatar}
                size='small'
              />
            </div>
          )}

          <span className={styles.label}>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
