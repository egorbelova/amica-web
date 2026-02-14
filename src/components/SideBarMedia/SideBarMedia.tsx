import React, { useEffect, useState, useLayoutEffect, useRef } from 'react';
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
import AudioLayout from '@/components/Message/AudioLayout';
import VideoLayout from '../Message/VideoLayout';
import { Dropdown } from '../Dropdown/Dropdown';
import { useSnackbar } from '@/contexts/snackbar/SnackbarContext';
import type { IconName } from '../Icons/AutoIcons';
import type { DropdownItem } from '../Dropdown/Dropdown';

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
  const tabsRef = useRef<HTMLDivElement>(null);
  const [attachmentsActive, setAttachmentsActive] = useState(false);
  const sidebarInnerRef = useRef<HTMLDivElement>(null);
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    if (!tabsRef.current) return;

    const tabs = tabsRef.current;
    const parent = tabs.parentElement;

    if (!parent) return;

    const sentinel = document.createElement('div');
    sentinel.style.height = '1px';

    parent.insertBefore(sentinel, tabs);

    const stickyTop = getComputedStyle(tabs).top;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setAttachmentsActive(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
        rootMargin: `-${stickyTop} 0px 0px 0px`,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      sentinel.remove();
    };
  }, []);

  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>('All');

  const [filteredMediaFiles, setFilteredMediaFiles] = useState<any[]>([]);

  useEffect(() => {
    setMediaFiles(
      messages
        ?.flatMap((msg) => msg.files || [])
        .filter((f) => f.category === 'image' || f.category === 'video')
        .reverse(),
    );
  }, [messages]);

  useEffect(() => {
    setFilteredMediaFiles(
      mediaFiles.filter(
        (f) =>
          (f.category === 'image' &&
            (filterType === 'Photos' || filterType === 'All')) ||
          (f.category === 'video' &&
            (filterType === 'Videos' || filterType === 'All')),
      ),
    );
  }, [mediaFiles, filterType]);

  const audioFiles = messages
    ?.flatMap((msg) => msg.files || [])
    .filter((f) => f.category === 'audio')
    .reverse();

  const [activeTab, setActiveTab] = useState<'media' | 'audio' | 'members'>(
    null,
  );

  useEffect(() => {
    if (selectedChat?.type === 'G') {
      setActiveTab('members');
    } else if (mediaFiles.length > 0) {
      setActiveTab('media');
    } else if (audioFiles.length > 0) {
      setActiveTab('audio');
    } else {
      setActiveTab(null);
    }
  }, [selectedChat, mediaFiles.length, audioFiles.length]);

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
    const sidebar = sidebarInnerRef.current;
    if (!sidebar || interlocutorEditVisible || !selectedChat.primary_media)
      return;

    let touchStartY = 0;
    let isTrackingTouch = false;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;

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
    sidebarInnerRef,
    selectedChat,
    interlocutorEditVisible,
  ]);

  useEffect(() => {
    setRollPosition(0);
  }, [interlocutorEditVisible]);

  const [subtitle, setSubtitle] = useState('');

  useEffect(() => {
    if (selectedChat.type === 'G') {
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
  const [items, setItems] = useState<DropdownItem<number>[]>([]);

  useEffect(() => {
    const hasVideos = mediaFiles.some((f) => f.category === 'video');
    const hasPhotos = mediaFiles.some((f) => f.category === 'image');
    const newItems: DropdownItem<number>[] = [
      { label: 'All', value: 1, icon: 'Circle' as IconName },
      hasVideos
        ? { label: 'Videos', value: 2, icon: 'Video' as IconName }
        : null,
      hasPhotos
        ? { label: 'Photos', value: 3, icon: 'Photo' as IconName }
        : null,
    ].filter(Boolean);

    setItems(newItems);
    if (
      (filterType === 'Videos' && !hasVideos) ||
      (filterType === 'Photos' && !hasPhotos)
    ) {
      setFilterType('All');
    }
  }, [mediaFiles, selectedChat]);

  const membersRef = useRef(null);
  const mediaRef = useRef(null);
  const audioRef = useRef(null);

  const [indicatorPosition, setIndicatorPosition] = useState(0);
  const [indicatorWidth, setIndicatorWidth] = useState(0);

  useLayoutEffect(() => {
    const updateIndicator = () => {
      let ref;
      if (activeTab === 'members') ref = membersRef;
      if (activeTab === 'media') ref = mediaRef;
      if (activeTab === 'audio') ref = audioRef;

      if (ref?.current) {
        setIndicatorPosition(ref.current.offsetLeft);
        setIndicatorWidth(ref.current.offsetWidth);
      }
    };

    updateIndicator();
  }, [activeTab, mediaFiles.length, audioFiles.length, selectedChat]);

  useEffect(() => {
    const sidebar = gridRef.current;
    if (!sidebar) return;

    let pointerStartX = 0;
    let isSwiping = false;

    const handlePointerDown = (e: PointerEvent) => {
      pointerStartX = e.clientX;
      isSwiping = true;
    };

    const handlePointerMove = (e: PointerEvent) => {};

    const handlePointerUp = (e: PointerEvent) => {
      if (!isSwiping) return;

      const pointerEndX = e.clientX;
      const deltaX = pointerEndX - pointerStartX;

      if (Math.abs(deltaX) > 50) {
        const tabsOrder: Array<'members' | 'media' | 'audio'> = [];
        if (selectedChat?.type === 'G') tabsOrder.push('members');
        if (mediaFiles.length > 0) tabsOrder.push('media');
        if (audioFiles.length > 0) tabsOrder.push('audio');

        const currentIndex = tabsOrder.indexOf(activeTab as any);

        if (deltaX < 0) {
          const nextIndex = Math.min(currentIndex + 1, tabsOrder.length - 1);
          setActiveTab(tabsOrder[nextIndex]);
        } else {
          const prevIndex = Math.max(currentIndex - 1, 0);
          setActiveTab(tabsOrder[prevIndex]);
        }
      }

      isSwiping = false;
    };

    sidebar.addEventListener('pointerdown', handlePointerDown);
    sidebar.addEventListener('pointermove', handlePointerMove);
    sidebar.addEventListener('pointerup', handlePointerUp);
    sidebar.addEventListener('pointercancel', handlePointerUp);

    return () => {
      sidebar.removeEventListener('pointerdown', handlePointerDown);
      sidebar.removeEventListener('pointermove', handlePointerMove);
      sidebar.removeEventListener('pointerup', handlePointerUp);
      sidebar.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [activeTab, selectedChat, mediaFiles, audioFiles]);

  const gridRef = useRef<HTMLDivElement>(null);

  const [rowScale, setRowScale] = useState(3);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const pinchThreshold = 1;
    const minColumns = 1;
    const maxColumns = 20;

    let pointers = new Map<number, PointerEvent>();
    let initialColumns = rowScale;
    let initialPositions = new Map<number, { x: number; y: number }>();

    const handlePointerDown = (e: PointerEvent) => {
      pointers.set(e.pointerId, e);
      initialPositions.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 2) {
        initialColumns = rowScale;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (pointers.size !== 2) return;

      pointers.set(e.pointerId, e);
      const [p1, p2] = Array.from(pointers.values());
      const pos1 = initialPositions.get(p1.pointerId)!;
      const pos2 = initialPositions.get(p2.pointerId)!;

      const averageDeltaX = (p1.clientX - pos1.x + (p2.clientX - pos2.x)) / 2;
      if (Math.abs(averageDeltaX) < 1) return;

      const container = gridRef.current!;
      const containerRect = container.getBoundingClientRect();

      const cursorXInContainerBefore =
        e.clientX - containerRect.left + container.scrollLeft;

      let newColumns = Math.round(initialColumns + averageDeltaX);
      newColumns = Math.max(minColumns, Math.min(maxColumns, newColumns));
      const prevColumns = rowScale;
      if (newColumns === prevColumns) return;

      setRowScale(newColumns);

      requestAnimationFrame(() => {
        const ratio = newColumns / prevColumns;
        const cursorXInContainerAfter = cursorXInContainerBefore * ratio;

        const targetScrollLeft =
          cursorXInContainerAfter - (e.clientX - containerRect.left);

        container.scrollLeft = targetScrollLeft;
      });
    };

    const handlePointerUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      initialPositions.delete(e.pointerId);

      if (pointers.size < 2) {
        initialColumns = rowScale;
      }
    };

    let wheelStart = 0;
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();

      if (Math.abs(e.deltaY) < 1) return;

      const container = sidebarInnerRef.current!;
      const containerRect = container.getBoundingClientRect();

      const cursorXInContainerBefore =
        e.clientX - containerRect.left + container.scrollLeft;

      const prevColumns = rowScale;
      const deltaColumns = e.deltaY / 10;
      let newColumns = Math.round(rowScale + deltaColumns);
      newColumns = Math.max(minColumns, Math.min(maxColumns, newColumns));

      if (newColumns === prevColumns) return;

      setRowScale(newColumns);

      requestAnimationFrame(() => {
        const ratio = newColumns / prevColumns;
        const cursorXInContainerAfter = cursorXInContainerBefore * ratio;

        const targetScrollLeft =
          cursorXInContainerAfter - (e.clientX - containerRect.left);

        container.scrollLeft = targetScrollLeft;
      });
    };

    const handleWheelEnd = () => {
      wheelStart = 0;
      initialColumns = rowScale;
    };

    grid.addEventListener('pointerdown', handlePointerDown);
    grid.addEventListener('pointermove', handlePointerMove);
    grid.addEventListener('pointerup', handlePointerUp);
    grid.addEventListener('pointercancel', handlePointerUp);
    grid.addEventListener('wheel', handleWheel, { passive: false });

    window.addEventListener('keyup', handleWheelEnd);
    window.addEventListener('mouseup', handleWheelEnd);

    return () => {
      grid.removeEventListener('pointerdown', handlePointerDown);
      grid.removeEventListener('pointermove', handlePointerMove);
      grid.removeEventListener('pointerup', handlePointerUp);
      grid.removeEventListener('pointercancel', handlePointerUp);
      grid.removeEventListener('wheel', handleWheel);

      window.removeEventListener('keyup', handleWheelEnd);
      window.removeEventListener('mouseup', handleWheelEnd);
    };
  }, [gridRef, rowScale]);

  const handleCopyEmail = async () => {
    if (!interlocutor?.email) return;

    try {
      await navigator.clipboard.writeText(interlocutor.email);
      showSnackbar('Email copied');
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  return (
    <div
      className={`${styles.container} ${visible ? styles.visible : ''}`}
      ref={sidebarRef}
    >
      <div
        className={
          styles.mask + ' ' + (attachmentsActive ? styles.visible : '')
        }
      />
      <div
        className={
          styles.maskBlur + ' ' + (attachmentsActive ? styles.visible : '')
        }
      />
      <div className={`${styles.sidebar}`} ref={sidebarInnerRef}>
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
            selectedChat.type === 'D' &&
            selectedChat?.members &&
            !attachmentsActive && (
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
          {attachmentsActive && activeTab === 'media' && (
            <>
              {/* <button
                type='button'
                className={`${styles.button} ${
                  interlocutorEditVisible ? styles.hidden : ''
                }`}
              >
                ...
              </button> */}
              <Dropdown
                items={items}
                placeholder=''
                value={items.find((item) => item.label === filterType)?.value}
                onChange={(value) => {
                  const selected = items.find((item) => item.value === value);
                  if (selected) setFilterType(selected.label);
                }}
              />
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
        </div>
        <div className={styles['sidebar__info']} ref={tabsRef}>
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
        {!interlocutorEditVisible && selectedChat.type === 'D' && (
          <div className={styles['sidebar__info-secondary']}>
            {selectedChat.type === 'D' && (
              <button
                className={styles['sidebar__info-secondary__item']}
                type='button'
                onClick={handleCopyEmail}
              >
                {interlocutor?.email}
              </button>
            )}
          </div>
        )}

        <div
          className={`${styles.sidebar__media} ${
            interlocutorEditVisible ? styles.hidden : ''
          }`}
        >
          <div className={styles.tabs}>
            <div className={styles['tabs-inner']}>
              <div
                className={styles.indicator}
                style={{
                  transform: `translateX(${indicatorPosition}px)`,
                  width: `${indicatorWidth - 4}px`,
                }}
              />

              {selectedChat?.members && selectedChat.type === 'G' && (
                <button
                  ref={membersRef}
                  className={`${styles.tab}`}
                  onClick={() => setActiveTab('members')}
                >
                  Members
                </button>
              )}

              {mediaFiles.length > 0 && (
                <button
                  ref={mediaRef}
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
                  ref={audioRef}
                  className={`${styles.tab} ${
                    activeTab === 'audio' ? styles.active : ''
                  }`}
                  onClick={() => setActiveTab('audio')}
                >
                  Audio
                </button>
              )}
            </div>
          </div>

          <div className={styles.content} ref={gridRef}>
            {activeTab === 'members' && selectedChat.type === 'G' && (
              <div className={styles.membersList}>
                {selectedChat?.members?.map((member) => (
                  <div key={member.id} className={styles.memberItem}>
                    <Avatar
                      className={styles.memberAvatar}
                      displayMedia={member.profile.primary_avatar}
                      displayName={member.username}
                    />
                    <div className={styles.memberInfo}>
                      <span className={styles.memberName}>
                        {member.username}
                      </span>
                      <span className={styles.memberLastSeen}>
                        {formatLastSeen(member.last_seen)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'media' && mediaFiles.length > 0 && (
              <div
                className={styles.grid}
                style={{
                  gridTemplateColumns: `repeat(${rowScale}, 1fr)`,
                }}
              >
                {filteredMediaFiles.map((file) => (
                  <div key={file.id} className={styles.mediaWrapper}>
                    {file.category === 'image' && (
                      <ProgressiveImage
                        small={file.thumbnail_small_url}
                        full={file.thumbnail_medium_url || file.file_url}
                        dominant_color={file.dominant_color}
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
              <div className={styles.audioGrid}>
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
    </div>
  );
};

export default SideBarMedia;
