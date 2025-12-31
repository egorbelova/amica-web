import { useRef, useState } from 'react';
import Avatar from '../Avatar/Avatar';
import { useUser } from '@/contexts/UserContext';
import styles from './Profile.module.scss';
import { useTranslation } from '@/contexts/LanguageContext';
import { Icon } from '../Icons/AutoIcons';
import { apiUpload } from '@/utils/apiFetch';
import AvatarCropModal from './AvatarCropModal';

export default function ProfileAccount() {
  const { user, logout, refreshUser } = useUser();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfileMediaClick = () => {
    fileInputRef.current?.click();
  };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setIsCropOpen(true);
    e.target.value = '';
  };

  return (
    <div className={styles.section}>
      <h3>{t('profileTabs.account')}</h3>
      <Avatar
        displayName={user.username}
        className={styles.avatar}
        displayMedia={user?.profile?.primary_avatar ?? undefined}
        size='small'
        onClick={handleProfileMediaClick}
      />
      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        hidden
        onChange={handleFileChange}
        className={styles.profileMediaInput}
      />

      {selectedFile && (
        <AvatarCropModal
          isOpen={isCropOpen}
          file={selectedFile}
          // @ts-ignore
          profileId={user.profile.id}
          onClose={() => setIsCropOpen(false)}
          onUploadSuccess={async () => {
            await refreshUser();
          }}
        />
      )}

      <div tabIndex={0} onClick={logout} className={styles.logoutBtn}>
        <Icon name='Logout' className={styles.logoutIcon} />
        {t('profile.signOut')}
      </div>
    </div>
  );
}
