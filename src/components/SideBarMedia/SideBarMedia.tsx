import React, { useEffect, useState, useMemo } from 'react';
import ProgressiveImage from '../Message/ProgressiveImage';
import styles from './SideBarMedia.module.scss';
import Avatar from '../Avatar/Avatar';
import Input from './Input';
import { formatLastSeen } from '../../utils/activityFormatter';
import { Icon } from '../Icons/AutoIcons';
import { useChat } from '../../contexts/ChatContext';
import { useUser } from '../../contexts/UserContext';

interface MediaItem {
  id: string | number;
  type: 'photo' | 'video';
  url?: string;
  small?: string;
  medium?: string;
  video_url?: string; // для видео
}

interface ChatUser {
  id: string | number;
  username?: string;
  profile?: {
    primary_avatar?: MediaItem;
    media?: MediaItem[];
    last_seen?: string | Date;
  };
}

interface FileItem {
  id: number;
  file_url: string;
  category: 'image' | 'video' | 'audio' | 'document' | 'pdf';
  thumbnail_small_url?: string;
  thumbnail_medium_url?: string;
  width?: number;
  height?: number;
}

interface Member {
  id: number;
  username: string;
  last_seen?: string;
  thumbnail_small?: string;
}

interface SideBarMediaProps {
  files: FileItem[];
  visible: boolean;
  members?: Member[];
  onClose?: () => void;
}

const SideBarMedia: React.FC<SideBarMediaProps> = ({
  files,
  onClose,
  visible,
  members,
}) => {
  const hasImages = files.some((f) => f.category === 'image');
  const hasVideos = files.some((f) => f.category === 'video');
  const { selectedChat } = useChat();
  const { user } = useUser();

  const initialTab = hasImages
    ? 'images'
    : hasVideos
    ? 'videos'
    : members?.length
    ? 'members'
    : null;
  const [activeTab, setActiveTab] = useState<
    'images' | 'videos' | 'members' | null
  >(initialTab);

  const filterFiles = () => {
    switch (activeTab) {
      case 'images':
        return files.filter((f) => f.category === 'image');
      case 'videos':
        return files.filter((f) => f.category === 'video');
      default:
        return [];
    }
  };

  const displayedFiles = filterFiles();

  const [interlocutorEditVisible, setInterlocutorEditVisible] = useState(false);

  const onInterlocutorEditBack = () => setInterlocutorEditVisible(false);
  const onInterlocutorEdit = () => setInterlocutorEditVisible(true);
  console.log(selectedChat);
  const getDisplayInfo = (): {
    displayName: string;
    imageSmall?: string | null;
    imageMedium?: string | null;
    primaryMedia?: string | null;
    secondaryMedia?: string | null;
    type?: string | null;
    photoRoll: MediaItem[];
    mediaRoll: MediaItem[];
    subtitle: string;
  } => {
    if (selectedChat.room_type === 'G') {
      return {
        displayName: selectedChat.name || 'Group Chat',
        imageSmall: selectedChat.photo || undefined,
        imageMedium: selectedChat.photo || undefined,
        photoRoll: [],
        mediaRoll: [],
        subtitle: `${selectedChat.users.length} members`,
      };
    }

    // Находим собеседника
    const interlocutor = selectedChat.users.find(
      (chatUser: ChatUser) => chatUser.id !== user?.id
    );

    if (!interlocutor) {
      return {
        displayName: 'Deleted User',
        photoRoll: [],
        mediaRoll: [],
        subtitle: 'User not found',
      };
    }

    // 🆕 Универсальная функция для получения URL медиа
    const getMediaUrl = (
      media: MediaItem | undefined | null
    ): string | null => {
      if (!media) return null;

      // Видео: используем video_url или url
      if (media.type === 'video') {
        return media.video_url || media.url || null;
      }

      // Изображение: small → medium → url
      return media.small || media.medium || media.url || null;
    };

    const getMediaUrls = (media: MediaItem | undefined | null) => ({
      primary: getMediaUrl(media),
      secondary:
        media?.type === 'video' ? getMediaUrl(media) : media?.medium || null,
    });

    const primaryAvatar = interlocutor.profile?.primary_avatar;
    const { primary: primaryMedia, secondary: secondaryMedia } =
      getMediaUrls(primaryAvatar);

    // 🆕 Форматируем mediaRoll ТОЧНО как primaryAvatar
    const mediaRoll = (interlocutor.profile?.media || [])
      .map((media: MediaItem) => ({
        ...media,
        primaryMedia: getMediaUrl(media),
        secondaryMedia:
          media.type === 'video' ? getMediaUrl(media) : media.medium || null,
        type: media.type,
      }))
      .filter((media): media is MediaItem & { primaryMedia: string } =>
        Boolean(media.primaryMedia)
      );

    return {
      displayName: interlocutor.username || 'Deleted User',
      primaryMedia,
      secondaryMedia,
      type: primaryAvatar?.type || null,
      photoRoll: [],
      mediaRoll, // ✅ Теперь с primaryMedia/secondaryMedia как у primaryAvatar
      subtitle: formatLastSeen(interlocutor.profile?.last_seen),
    };
  };

  const displayInfo = useMemo(() => getDisplayInfo(), [selectedChat, user]);
  const {
    displayName,
    primaryMedia,
    secondaryMedia,
    mediaRoll,
    type,
    subtitle,
  } = displayInfo;

  const [value, setValue] = useState(displayName);

  useEffect(() => {
    if (!interlocutorEditVisible) {
      setValue(displayName);
    }
  }, [interlocutorEditVisible, displayName]);

  const [isAvatarRollerOpen, setIsAvatarRollerOpen] = useState(false);

  useEffect(() => {
    setIsAvatarRollerOpen(false);
    setRollPosition(0);
  }, [selectedChat]);

  const sidebarRef = React.useRef<HTMLDivElement>(null);

  const [rollPosition, setRollPosition] = useState(0);

  const handleRollPositionChange = () => {
    if (interlocutorEditVisible || !isAvatarRollerOpen) return;
    setRollPosition((prev) => (prev === mediaRoll!.length ? 0 : prev + 1));
  };

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    let touchStartY = 0;
    let isTrackingTouch = false;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 0 && isAvatarRollerOpen) {
        setIsAvatarRollerOpen(false);
        setRollPosition(0);
      }

      if (e.deltaY < 0 && sidebar.scrollTop === 0 && !isAvatarRollerOpen) {
        setIsAvatarRollerOpen(true);
        setRollPosition(0);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      isTrackingTouch = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTrackingTouch) return;

      const currentY = e.touches[0].clientY;
      const deltaY = touchStartY - currentY;

      if (deltaY > 30 && isAvatarRollerOpen) {
        setIsAvatarRollerOpen(false);
        setRollPosition(0);
        isTrackingTouch = false;
      }

      if (deltaY < -30 && sidebar.scrollTop === 0 && !isAvatarRollerOpen) {
        setIsAvatarRollerOpen(true);
        setRollPosition(0);
        isTrackingTouch = false;
      }
    };

    const handleTouchEnd = () => {
      isTrackingTouch = false;
    };

    sidebar.addEventListener('wheel', handleWheel, { passive: true });
    sidebar.addEventListener('touchstart', handleTouchStart, { passive: true });
    sidebar.addEventListener('touchmove', handleTouchMove, { passive: false });
    sidebar.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      sidebar.removeEventListener('wheel', handleWheel);
      sidebar.removeEventListener('touchstart', handleTouchStart);
      sidebar.removeEventListener('touchmove', handleTouchMove);
      sidebar.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    isAvatarRollerOpen,
    setIsAvatarRollerOpen,
    setRollPosition,
    sidebarRef,
    selectedChat,
  ]);

  useEffect(() => {
    setRollPosition(0);
  }, [interlocutorEditVisible]);

  return (
    <div
      className={`${styles.sidebar} ${visible ? styles.visible : ''}`}
      ref={sidebarRef}
    >
      <div className={styles.header}>
        <div
          onClick={interlocutorEditVisible ? onInterlocutorEditBack : onClose}
          className={styles.button}
        >
          {interlocutorEditVisible ? (
            <Icon name='Arrow' style={{ transform: 'rotate(180deg)' }} />
          ) : (
            <Icon name='Cross' />
          )}
        </div>

        <div
          className={`${styles.button} ${
            interlocutorEditVisible ? styles.hidden : ''
          }`}
          onClick={onInterlocutorEdit}
        >
          Edit
        </div>
      </div>

      <div
        className={`${styles['sidebar__avatar-container']} ${
          isAvatarRollerOpen && !interlocutorEditVisible
            ? styles['sidebar__avatar-container--roller']
            : ''
        } `}
      >
        <div
          className={`${styles['sidebar__avatar-wrapper']} ${
            interlocutorEditVisible
              ? styles['sidebar__avatar-wrapper--edit']
              : ''
          } ${
            isAvatarRollerOpen && !interlocutorEditVisible
              ? styles['sidebar__avatar-wrapper--roller']
              : ''
          }`}
          style={{ transform: `translateX(${rollPosition * -100}%)` }}
          onClick={handleRollPositionChange}
        >
          <Avatar
            displayName={displayInfo.displayName}
            imageUrl={
              isAvatarRollerOpen
                ? displayInfo.secondaryMedia
                : displayInfo.primaryMedia
            }
            className={styles['sidebar__avatar']}
            mediaType={displayInfo.type}
            onClick={
              displayInfo.primaryMedia && !interlocutorEditVisible
                ? () => setIsAvatarRollerOpen(true)
                : undefined
            }
          />
          {/* ✅ Роллер - используем displayInfo.mediaRoll */}
          {isAvatarRollerOpen &&
            displayInfo.mediaRoll.length > 0 &&
            !interlocutorEditVisible && (
              <div className={styles.avatarRoller}>
                {displayInfo.mediaRoll.map((photo) => (
                  <Avatar
                    key={photo.id}
                    displayName={displayInfo.displayName}
                    imageUrl={photo.primaryMedia}
                    mediaType={photo.type}
                    className={styles['sidebar__avatar']}
                    size='small'
                  />
                ))}
              </div>
            )}
        </div>
        <div className={styles['sidebar__info']}>
          <div
            contentEditable={interlocutorEditVisible}
            suppressContentEditableWarning
            className={styles['sidebar__name']}
            onInput={
              interlocutorEditVisible
                ? (e) => setValue((e.target as HTMLDivElement).innerText)
                : undefined
            }
          >
            {value}
          </div>
          <span className={styles['sidebar__subtitle']}>{subtitle}</span>
        </div>
      </div>

      <div
        className={`${styles.sidebar__media} ${
          interlocutorEditVisible ? styles.hidden : ''
        }`}
      >
        <div className={styles.tabs}>
          {members && (
            <button
              className={`${styles.tab} ${
                activeTab === 'members' ? styles.active : ''
              }`}
              onClick={() => setActiveTab('members')}
            >
              Members
            </button>
          )}
          {hasImages && (
            <button
              className={`${styles.tab} ${
                activeTab === 'images' ? styles.active : ''
              }`}
              onClick={() => setActiveTab('images')}
            >
              Images
            </button>
          )}
          {hasVideos && (
            <button
              className={`${styles.tab} ${
                activeTab === 'videos' ? styles.active : ''
              }`}
              onClick={() => setActiveTab('videos')}
            >
              Videos
            </button>
          )}
        </div>

        <div className={styles.content}>
          {activeTab === 'members' && members && (
            <div className={styles.membersList}>
              {members.map((member) => (
                <div key={member.id} className={styles.memberItem}>
                  <Avatar
                    className={styles.memberAvatar}
                    displayName={member.username}
                    //@ts-ignore
                    imageUrl={member?.profile?.primary_photo?.small || ''}
                  />
                  <div className={styles.memberInfo}>
                    <span className={styles.memberName}>{member.username}</span>
                    <span className={styles.memberLastSeen}>
                      {formatLastSeen(member.last_seen)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(activeTab === 'images' || activeTab === 'videos') &&
            displayedFiles.length > 0 && (
              <div className={styles.grid}>
                {displayedFiles.map((file) => {
                  if (file.category === 'image') {
                    return (
                      <ProgressiveImage
                        key={file.id}
                        small={file.thumbnail_small_url}
                        full={file.thumbnail_medium_url || file.file_url}
                        dominant_color='#eee'
                      />
                    );
                  }
                  if (file.category === 'video') {
                    return (
                      <video
                        key={file.id}
                        src={file.file_url}
                        className={styles.mediaItem}
                        controls
                      />
                    );
                  }
                  return null;
                })}
              </div>
            )}
        </div>
      </div>
      {interlocutorEditVisible && (
        <div className={`${styles.interlocutorEdit} ${styles.visible}`}>
          <div className={styles.form}>
            {selectedChat.room_type === 'D' && (
              <>
                {/* <Input placeholder='First Name' isRequired />
                <Input placeholder='Last Name' />
                <Input placeholder='Notes' /> */}
              </>
            )}
            {selectedChat.room_type === 'G' && (
              <>
                <Input
                  placeholder='Group Name'
                  isRequired
                  value={value}
                  onChange={setValue}
                />
                {/* <Input placeholder='Description' /> */}
              </>
            )}

            <div className={`${styles.button} ${styles.save}`}>Save</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SideBarMedia;
