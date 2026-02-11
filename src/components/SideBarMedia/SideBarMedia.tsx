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
import type { File } from '@/types';
import type { User } from '@/types';
import AudioLayout from '@/components/Message/AudioLayout';
import VideoLayout from '../Message/VideoLayout';

interface SideBarMediaProps {
  visible: boolean;
  onClose?: () => void;
}

const SideBarMedia: React.FC<SideBarMediaProps> = ({ onClose, visible }) => {
  const {
    selectedChat,
    addContact,
    deleteContact,
    saveContact,
    messages,
  }: any = useChat();
  const { user } = useUser();
  const { t, locale }: { t: any; locale: Locale } = useTranslation();
  console.log(selectedChat);
  const mediaFiles = messages
    ?.flatMap((msg) => msg.files || [])
    .filter((f) => f.category === 'image' || f.category === 'video')
    .reverse();
  const audioFiles = messages
    ?.flatMap((msg) => msg.files || [])
    .filter((f) => f.category === 'audio')
    .reverse();

  const initialTab = mediaFiles?.length ? 'media' : audioFiles?.length;

  const [activeTab, setActiveTab] = useState<
    'media' | 'audio' | 'members' | null
  >(initialTab);

  // const filterFiles = () => {
  //   switch (activeTab) {
  //     case 'media':
  //       return files.filter((f) => f.category === 'image');
  //     case 'audio':
  //       return files.filter((f) => f.category === 'audio');
  //     default:
  //       return [];
  //   }
  // };

  // const displayedFiles = filterFiles();

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

  const interlocutor = selectedChat?.members?.[0];

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
          selectedChat?.members && (
            <>
              {selectedChat.members[0].is_contact ? (
                <div
                  className={`${styles.button} ${
                    interlocutorEditVisible ? styles.hidden : ''
                  }`}
                  onClick={onInterlocutorEdit}
                >
                  Edit
                </div>
              ) : (
                <div
                  className={`${styles.button} ${
                    interlocutorEditVisible ? styles.hidden : ''
                  }`}
                  onClick={() => {
                    addContact(selectedChat.members[0].id);
                  }}
                >
                  Add Contact
                </div>
              )}
            </>
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
            objectId={interlocutor?.contact_id}
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
            displayMedia={selectedChat.primary_media}
            size={isAvatarRollerOpen ? 'medium' : 'small'}
            className={styles['sidebar__avatar']}
            onClick={
              -ignore
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
          {selectedChat?.members && selectedChat.chat_type === 'G' && (
            <button
              className={`${styles.tab} ${
                activeTab === 'members' ? styles.active : ''
              }`}
              onClick={() => setActiveTab('members')}
            >
              Members
            </button>
          )}
          {mediaFiles.length > 0 && (
            <button
              className={`${styles.tab} ${
                activeTab === 'media' ? styles.active : ''
              }`}
              onClick={() => setActiveTab('media')}
            >
              Media
            </button>
          )}
          {audioFiles.length > 0 && (
            <button
              className={`${styles.tab} ${
                activeTab === 'audio' ? styles.active : ''
              }`}
              onClick={() => setActiveTab('audio')}
            >
              Audio
            </button>
          )}
        </div>

        <div className={styles.content}>
          {activeTab === 'members' && selectedChat.chat_type === 'G' && (
            <div className={styles.membersList}>
              {selectedChat?.members.map((member) => (
                <div key={member.id} className={styles.memberItem}>
                  <Avatar
                    className={styles.memberAvatar}
                    displayName={member.username}
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

          {activeTab === 'media' && mediaFiles.length > 0 && (
            <div className={styles.grid}>
              {mediaFiles.map((file) => (
                <div key={file.id} className={styles.mediaWrapper}>
                  {file.category === 'image' && (
                    <ProgressiveImage
                      small={file.thumbnail_small_url}
                      full={file.thumbnail_medium_url || file.file_url}
                      dominant_color='#eee'
                    />
                  )}
                  {file.category === 'video' && (
                    <VideoLayout
                      full={file.file_url}
                      has_audio={file.has_audio}
                      // className={styles.mediaItem}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'audio' && audioFiles.length > 0 && (
            <div className={styles.grid2}>
              {audioFiles.map((file) => (
                <AudioLayout
                  key={file.id}
                  full={file.file_url}
                  waveform={file.waveform}
                  duration={file.duration}
                  id={file.id}
                  cover_url={file.cover_url}
                />
              ))}
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

            <button
              className={`${styles.button} ${styles.save}`}
              type='button'
              onClick={() => saveContact(interlocutor?.contact_id, value)}
            >
              {t('buttons.save')}
            </button>
            <button
              className={`${styles.button} ${styles.delete}`}
              type='button'
              onClick={() => {
                deleteContact(interlocutor?.contact_id);
                setInterlocutorEditVisible(false);
              }}
            >
              Delete Contact
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SideBarMedia;
