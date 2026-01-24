import React, { useEffect, useState, useMemo } from 'react';
import ProgressiveImage from '../Message/ProgressiveImage';
import styles from './SideBarMedia.module.scss';
import Avatar from '../Avatar/Avatar';
import Input from './Input';
import { formatLastSeen } from '../../utils/activityFormatter';
import { Icon } from '../Icons/AutoIcons';
import { useChat } from '../../contexts/ChatContext';
import { useUser } from '../../contexts/UserContext';
import { useTranslation, type Locale } from '@/contexts/LanguageContext';
import EditableAvatar from '@/components/Avatar/EditableAvatar';
import MorphingIcon from '@/utils/morphSVG';

interface MediaProfileItem {
  id: string | number;
  type: 'photo' | 'video';
  url?: string;
  small?: string;
  medium?: string;
  video_url?: string;
}

interface FileItem {
  id: number;
  file_url: string;
  category: 'image' | 'video' | 'audio' | 'document' | 'pdf';
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
  const { selectedChat }: any = useChat();
  const { user } = useUser();
  const { t, locale }: { t: any; locale: Locale } = useTranslation();

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

  const [value, setValue] = useState(selectedChat.name || '');

  useEffect(() => {
    if (!interlocutorEditVisible) {
      setValue(selectedChat.name || '');
    }
  }, [interlocutorEditVisible, selectedChat.name]);

  const [isAvatarRollerOpen, setIsAvatarRollerOpen] = useState(false);

  useEffect(() => {
    setIsAvatarRollerOpen(false);
    setRollPosition(0);
  }, [selectedChat]);

  const sidebarRef = React.useRef<HTMLDivElement>(null);

  const [rollPosition, setRollPosition] = useState(0);

  const handleRollPositionChange = () => {
    if (interlocutorEditVisible || !isAvatarRollerOpen || !selectedChat.media)
      return;
    setRollPosition((prev) =>
      prev === selectedChat.media!.length ? 0 : prev + 1,
    );
  };

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar || interlocutorEditVisible) return;

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
    interlocutorEditVisible,
  ]);

  useEffect(() => {
    setRollPosition(0);
  }, [interlocutorEditVisible]);

  const [subtitle, setSubtitle] = useState('');

  useEffect(() => {
    if (selectedChat.chat_type === 'G') {
      setSubtitle(`${selectedChat.info} members`);
    } else {
      setSubtitle(formatLastSeen(selectedChat.info));
    }
  }, [selectedChat, user]);

  const getPathD = (iconName: string) => {
    const symbol = document.getElementById(`icon-${iconName}`);
    if (!symbol) return '';
    const path = symbol.querySelector('path');

    return path?.getAttribute('d') || '';
  };

  const [iconPaths, setIconPaths] = useState<{
    cross: string;
    arrow: string;
  }>({ cross: '', arrow: '' });

  useEffect(() => {
    setIconPaths({
      cross: getPathD('Cross'),
      arrow: getPathD('Arrow'),
    });
  }, []);

  const interlocutor = selectedChat?.users?.[0];
  const contactId = interlocutor?.contact_id;
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

          {/* <MorphingIcon
            shape1={iconPaths.cross}
            shape2={iconPaths.arrow}
            active={interlocutorEditVisible}
          /> */}
        </div>

        {selectedChat &&
          selectedChat.chat_type === 'D' &&
          selectedChat.users &&
          selectedChat.users[0].is_contact && (
            <div
              className={`${styles.button} ${
                interlocutorEditVisible ? styles.hidden : ''
              }`}
              onClick={onInterlocutorEdit}
            >
              Edit
            </div>
          )}
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
          <EditableAvatar
            key={selectedChat.id}
            displayName={selectedChat.name}
            avatar={selectedChat.primary_media}
            objectId={contactId}
            contentType='contact'
            className={styles['sidebar__avatar']}
            classNameAvatar={styles['sidebar__editable-avatar']}
            isAvatarRollerOpen={isAvatarRollerOpen}
            onClick={
              selectedChat.primary_media && !interlocutorEditVisible
                ? () => setIsAvatarRollerOpen(true)
                : undefined
            }
            onAvatarChange={(primary_avatar) => {
              // setUser({
              //   ...user,
              //   profile: {
              //     ...user.profile,
              //     primary_avatar,
              //   },
              // });
            }}
            isEditable={interlocutorEditVisible}
          />
          {/* <Avatar
            key={selectedChat.id}
            displayName={selectedChat.name}
            //@ts-ignore
            displayMedia={selectedChat.primary_media}
            size={isAvatarRollerOpen ? 'medium' : 'small'}
            className={styles['sidebar__avatar']}
            onClick={
              //@ts-ignore
              selectedChat.primary_media && !interlocutorEditVisible
                ? () => setIsAvatarRollerOpen(true)
                : undefined
            }
          /> */}
          {selectedChat.media && selectedChat.media.length > 0 && (
            <>
              {selectedChat.media.map((media) => (
                <Avatar
                  key={media.id}
                  displayName={selectedChat.name}
                  displayMedia={media}
                  size={isAvatarRollerOpen ? 'medium' : 'small'}
                  className={`${styles['sidebar__avatar']} ${
                    isAvatarRollerOpen && !interlocutorEditVisible
                      ? ''
                      : styles['hidden']
                  }`}
                />
              ))}
            </>
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
                        //@ts-ignore
                        small={file.thumbnail_small_url}
                        //@ts-ignore
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

            <div className={`${styles.button} ${styles.save}`}>
              {t('buttons.save')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SideBarMedia;
