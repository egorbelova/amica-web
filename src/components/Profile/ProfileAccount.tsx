import { useRef, useState } from 'react';
import Avatar from '../Avatar/Avatar';
import { useUser } from '@/contexts/UserContext';
import styles from './Profile.module.scss';
import { useTranslation } from '@/contexts/LanguageContext';
import { Icon } from '../Icons/AutoIcons';
import { apiUpload } from '@/utils/apiFetch';
import AvatarCropModal from './AvatarCropModal';

export default function ProfileAccount() {
  const { user, logout, setUser } = useUser();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleProfileMediaClick = () => {
    fileInputRef.current?.click();
  };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setSelectedFile(file);
    setIsCropOpen(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFile(file);
    e.target.value = '';
  };

  return (
    <div className={styles.section}>
      <h3>{t('profileTabs.account')}</h3>
      <div
        onClick={handleProfileMediaClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`${styles.avatarDropZone} ${
          isDragOver ? styles.dragOver : ''
        }`}
      >
        <Avatar
          displayName={user.username}
          className={styles.avatar + ' ' + styles.editAvatar}
          displayMedia={user?.profile?.primary_avatar ?? undefined}
          size='small'
        />
        <Icon name='Edit' className={styles.uploadIcon} />
      </div>

      <input
        ref={fileInputRef}
        type='file'
        accept='image/video/*'
        hidden
        onChange={handleFileChange}
        className={styles.profileMediaInput}
      />

      {selectedFile && (
        <AvatarCropModal
          isOpen={isCropOpen}
          type='photo'
          file={selectedFile}
          // @ts-ignore
          profileId={user.profile.id}
          onClose={() => setIsCropOpen(false)}
          onUploadSuccess={(primary_avatar) => {
            setUser({
              ...user,
              profile: {
                ...user.profile,
                primary_avatar: primary_avatar,
              },
            });
            setSelectedFile(null);
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
