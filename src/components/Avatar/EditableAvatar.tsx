import { useRef, useState } from 'react';
import Avatar from '../Avatar/Avatar';
import { Icon } from '../Icons/AutoIcons';
import AvatarCropModal from './AvatarCropModal';
import styles from './AvatarCropModal.module.scss';

type EditableAvatarProps = {
  displayName: string;
  avatar?: any;
  objectId: number;
  contentType: string;
  onAvatarChange: (avatar: any) => void;
  isEditable?: boolean;
  className?: string;
  classNameAvatar?: string;
  isAvatarRollerOpen?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
};

export default function EditableAvatar({
  displayName,
  avatar,
  objectId,
  contentType,
  onAvatarChange,
  isEditable = false,
  className = '',
  classNameAvatar = '',
  isAvatarRollerOpen = false,
  onClick = () => {},
}: EditableAvatarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/'))
      return;
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
    if (file) handleFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFile(file);
    e.target.value = '';
  };

  return (
    <>
      <div
        onClick={openFileDialog}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`${styles.avatarDropZone} ${
          isDragOver ? styles.dragOver : ''
        } ${className}`}
        style={{ flexShrink: 0 }}
      >
        <Avatar
          displayName={displayName}
          className={`${styles.avatar} ${
            isEditable && styles.editAvatar
          } ${classNameAvatar}`}
          displayMedia={avatar}
          size={isAvatarRollerOpen ? 'medium' : 'small'}
          onClick={onClick}
        />
        {isEditable && <Icon name='Edit' className={styles.uploadIcon} />}
      </div>

      {isEditable && (
        <>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*,video/*'
            hidden
            onChange={handleFileChange}
            className={styles.profileMediaInput}
          />

          {selectedFile && (
            <AvatarCropModal
              isOpen={isCropOpen}
              type={selectedFile.type.startsWith('image/') ? 'photo' : 'video'}
              file={selectedFile}
              objectId={objectId}
              contentType={contentType}
              onClose={() => setIsCropOpen(false)}
              onUploadSuccess={(primary_avatar) => {
                onAvatarChange(primary_avatar);
                setSelectedFile(null);
              }}
            />
          )}
        </>
      )}
    </>
  );
}
