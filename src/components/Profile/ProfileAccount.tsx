import { useUser } from '@/contexts/UserContext';
import styles from './Profile.module.scss';
import { useTranslation } from '@/contexts/LanguageContext';
import { Icon } from '../Icons/AutoIcons';
import EditableAvatar from '@/components/Avatar/EditableAvatar';
import type { DisplayMedia, User, UserProfile } from '@/types';

export default function ProfileAccount() {
  const { user, logout, setUser } = useUser();
  const { t } = useTranslation();

  return (
    <div className={styles.section}>
      <EditableAvatar
        displayName={user?.username || ''}
        avatar={user?.profile?.primary_avatar}
        objectId={user?.profile?.id || 0}
        contentType='profile'
        onAvatarChange={(primary_avatar) => {
          setUser({
            ...(user as User | null),
            profile: {
              ...(user?.profile as UserProfile),
              primary_avatar: primary_avatar as DisplayMedia,
            } as UserProfile,
          } as User);
        }}
        isEditable={true}
      />
      <div className={styles.info}>
        <div className={styles.username}>{user?.username || ''}</div>
        <div className={styles.email}>{user?.email || ''}</div>
      </div>

      <div tabIndex={0} onClick={logout} className={styles.logoutBtn}>
        <Icon name='Logout' className={styles.logoutIcon} />
        {t('profile.signOut')}
      </div>
    </div>
  );
}
