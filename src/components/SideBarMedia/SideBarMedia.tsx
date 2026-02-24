import React, {
  useCallback,
  useEffect,
  useState,
  useLayoutEffect,
  useRef,
  useMemo,
} from 'react';
import ProgressiveImage from '../Message/ProgressiveImage';
import styles from './SideBarMedia.module.scss';
import Avatar from '../Avatar/Avatar';
import Input from './Input';
import { formatLastSeen } from '../../utils/activityFormatter';
import { Icon } from '../Icons/AutoIcons';
import { useChat } from '@/contexts/ChatContextCore';
import { useTranslation } from '@/contexts/languageCore';
import EditableAvatar from '@/components/Avatar/EditableAvatar';
// import MorphingIcon from '@/utils/morphSVG';
import AudioLayout from '@/components/Message/AudioLayout';
import VideoLayout from '../Message/VideoLayout';
import { Dropdown } from '../Dropdown/Dropdown';
import { useSnackbar } from '@/contexts/snackbar/SnackbarContextCore';
import type { IconName } from '../Icons/AutoIcons';
import type { DropdownItem } from '../Dropdown/Dropdown';
import type { Message, File, User, DisplayMedia } from '@/types';
import type { ChatContextType } from '@/contexts/ChatContextCore';
import Button from '../ui/button/Button';

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
  }: ChatContextType = useChat();
  const { t } = useTranslation();
  const tabsRef = useRef<HTMLDivElement>(null);
  const [attachmentsActive, setAttachmentsActive] = useState(false);
  const sidebarInnerRef = useRef<HTMLDivElement>(null);
  const { showSnackbar } = useSnackbar();
  const [rollerOpenByChatId, setRollerOpenByChatId] = useState<
    Record<string, boolean>
  >({});
  const [rollPositionByChatId, setRollPositionByChatId] = useState<
    Record<string, number>
  >({});

  const chatId = selectedChat?.id ?? '';
  const isAvatarRollerOpen = rollerOpenByChatId[chatId] ?? false;
  const rollPosition = rollPositionByChatId[chatId] ?? 0;

  const setIsAvatarRollerOpen = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      if (!chatId) return;
      setRollerOpenByChatId((prev) => {
        const current = prev[chatId] ?? false;
        const next = typeof value === 'function' ? value(current) : value;
        return { ...prev, [chatId]: next };
      });
    },
    [chatId],
  );
  const setRollPosition = useCallback(
    (value: number | ((prev: number) => number)) => {
      if (!chatId) return;
      setRollPositionByChatId((prev) => {
        const current = prev[chatId] ?? 0;
        const next = typeof value === 'function' ? value(current) : value;
        return { ...prev, [chatId]: next };
      });
    },
    [chatId],
  );
  const [nameDraftByChatId, setNameDraftByChatId] = useState<
    Record<string, string>
  >({});
  const editValue = nameDraftByChatId[chatId] ?? (selectedChat?.name || '');
  const setValue = useCallback(
    (nextValue: string) => {
      if (!chatId) return;
      setNameDraftByChatId((prev) => ({ ...prev, [chatId]: nextValue }));
    },
    [chatId],
  );

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

  const mediaFiles = useMemo(
    () =>
      messages
        ?.flatMap((msg: Message) => msg.files || [])
        .filter((f: File) => f.category === 'image' || f.category === 'video')
        .reverse() || [],
    [messages],
  );
  const [filterType, setFilterType] = useState<string>('All');

  const hasVideos = useMemo(
    () => mediaFiles.some((f) => f.category === 'video'),
    [mediaFiles],
  );
  const hasPhotos = useMemo(
    () => mediaFiles.some((f) => f.category === 'image'),
    [mediaFiles],
  );

  const items = useMemo(() => {
    const newItems: (DropdownItem<number> | null)[] = [
      { label: 'All', value: 1, icon: 'Circle' as IconName },
      hasVideos
        ? { label: 'Videos', value: 2, icon: 'Video' as IconName }
        : null,
      hasPhotos
        ? { label: 'Photos', value: 3, icon: 'Photo' as IconName }
        : null,
    ].filter(Boolean);
    return newItems as DropdownItem<number>[];
  }, [hasVideos, hasPhotos]);

  const effectiveFilterType = useMemo(() => {
    if (
      (filterType === 'Videos' && !hasVideos) ||
      (filterType === 'Photos' && !hasPhotos)
    ) {
      return 'All';
    }
    return filterType;
  }, [filterType, hasVideos, hasPhotos]);

  const filteredMediaFilesMemo = useMemo(
    () =>
      mediaFiles.filter(
        (f: File) =>
          (f.category === 'image' &&
            (effectiveFilterType === 'Photos' ||
              effectiveFilterType === 'All')) ||
          (f.category === 'video' &&
            (effectiveFilterType === 'Videos' ||
              effectiveFilterType === 'All')),
      ),
    [mediaFiles, effectiveFilterType],
  );

  const audioFiles = useMemo(
    () =>
      messages
        ?.flatMap((msg: Message) => msg.files || [])
        .filter((f: File) => f.category === 'audio')
        .reverse() || [],
    [messages],
  );

  const availableTabs = useMemo(() => {
    const tabs: ('members' | 'media' | 'audio')[] = [];
    if (selectedChat?.type === 'G') tabs.push('members');
    if (mediaFiles.length > 0) tabs.push('media');
    if (audioFiles.length > 0) tabs.push('audio');
    return tabs;
  }, [selectedChat.type, mediaFiles.length, audioFiles.length]);

  const [userSelectedTab, setActiveTab] = useState<
    'media' | 'audio' | 'members' | null
  >(null);
  const [prevChatId, setPrevChatId] = useState<number | null>(null);

  if (selectedChat?.id !== prevChatId) {
    setPrevChatId(selectedChat?.id ?? null);
    setActiveTab(null);
  }

  const activeTab = useMemo(() => {
    if (userSelectedTab && availableTabs.includes(userSelectedTab)) {
      return userSelectedTab;
    }
    return availableTabs[0] || null;
  }, [userSelectedTab, availableTabs]);

  const [interlocutorEditVisible, setInterlocutorEditVisible] = useState(false);
  const visibleName = interlocutorEditVisible
    ? editValue
    : selectedChat?.name || '';

  const onInterlocutorEditBack = () => setInterlocutorEditVisible(false);
  const onInterlocutorEdit = () => {
    if (chatId) {
      setNameDraftByChatId((prev) => ({
        ...prev,
        [chatId]: prev[chatId] ?? (selectedChat?.name || ''),
      }));
    }
    setInterlocutorEditVisible(true);
  };

  const sidebarRef = React.useRef<HTMLDivElement>(null);

  const handleRollPositionChange = () => {
    if (interlocutorEditVisible || !isAvatarRollerOpen || !selectedChat?.media)
      return;
    setRollPosition((prev) =>
      prev === selectedChat?.media!.length ? 0 : prev + 1,
    );
  };

  useEffect(() => {
    const sidebar = sidebarInnerRef.current;
    if (!sidebar || interlocutorEditVisible || !selectedChat?.primary_media)
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

  const effectiveRollPosition = interlocutorEditVisible ? 0 : rollPosition;

  const subtitle = useMemo(() => {
    if (selectedChat?.type === 'G') {
      return `${selectedChat?.info || ''} members`;
    }
    return formatLastSeen(selectedChat?.info || '');
  }, [selectedChat?.type, selectedChat?.info]);

  const interlocutor = selectedChat?.members?.[0];

  const membersRef = useRef(null);
  const mediaRef = useRef(null);
  const audioRef = useRef(null);

  const [indicatorPosition, setIndicatorPosition] = useState(0);
  const [indicatorWidth, setIndicatorWidth] = useState(0);

  useLayoutEffect(() => {
    const updateIndicator = () => {
      let ref: { current: HTMLButtonElement | null } | null = null;
      if (activeTab === 'members') ref = membersRef;
      if (activeTab === 'media') ref = mediaRef;
      if (activeTab === 'audio') ref = audioRef;

      if (ref?.current) {
        const { offsetLeft, offsetWidth } = ref.current;
        requestAnimationFrame(() => {
          setIndicatorPosition(offsetLeft);
          setIndicatorWidth(offsetWidth);
        });
      }
    };

    updateIndicator();
  }, [activeTab, availableTabs]);

  useEffect(() => {
    const sidebar = gridRef.current;
    if (!sidebar) return;

    let pointerStartX = 0;
    let isSwiping = false;

    const handlePointerDown = (e: PointerEvent) => {
      pointerStartX = e.clientX;
      isSwiping = true;
    };

    const handlePointerMove = () => {};

    const handlePointerUp = (e: PointerEvent) => {
      if (!isSwiping) return;

      const pointerEndX = e.clientX;
      const deltaX = pointerEndX - pointerStartX;

      if (Math.abs(deltaX) > 50) {
        const tabsOrder = availableTabs;

        const currentIndex = tabsOrder.indexOf(
          activeTab as 'members' | 'media' | 'audio',
        );

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
  }, [activeTab, availableTabs]);

  const gridRef = useRef<HTMLDivElement>(null);

  const [rowScale, setRowScale] = useState(3);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    // const pinchThreshold = 1;
    const minColumns = 1;
    const maxColumns = 20;

    const pointers = new Map<number, PointerEvent>();
    let initialColumns = rowScale;
    const initialPositions = new Map<number, { x: number; y: number }>();

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

    // let wheelStart = 0;
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
      <div className={styles.content}>
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
            <Button
              onClick={
                interlocutorEditVisible ? onInterlocutorEditBack : onClose
              }
              className={styles.button}
            >
              {interlocutorEditVisible ? (
                <Icon name='Arrow' style={{ transform: 'rotate(180deg)' }} />
              ) : (
                <Icon name='Cross' />
              )}
            </Button>

            {selectedChat &&
              selectedChat.type === 'D' &&
              selectedChat?.members &&
              !attachmentsActive && (
                <>
                  <Button
                    className={`${styles.button} ${
                      interlocutorEditVisible ? styles.hidden : ''
                    }`}
                    onClick={
                      selectedChat.members[0].is_contact
                        ? onInterlocutorEdit
                        : () => addContact(selectedChat.members[0].id)
                    }
                  >
                    {selectedChat.members[0].is_contact
                      ? 'Edit'
                      : 'Add to Contacts'}
                  </Button>
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
                  value={
                    items.find((item) => item.label === effectiveFilterType)
                      ?.value || 0
                  }
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
              style={{
                transform: `translateX(${effectiveRollPosition * -100}%)`,
              }}
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
                onAvatarChange={() => {
                  // setUser({
                  //   ...user,
                  //   profile: {
                  //     ...user.profile,
                  //     primary_media,
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
                  {selectedChat.media.map((media: DisplayMedia) => (
                    <Avatar
                      key={media.id}
                      displayName={selectedChat.name}
                      displayMedia={media as unknown as DisplayMedia}
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
              {visibleName}
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
                  {selectedChat?.members?.map((member: User) => (
                    <div key={member?.id} className={styles.memberItem}>
                      <Avatar
                        className={styles.memberAvatar}
                        displayMedia={member.profile.primary_media}
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
                  {filteredMediaFilesMemo.map((file) => (
                    <div key={file.id} className={styles.mediaWrapper}>
                      {file.category === 'image' && (
                        <ProgressiveImage
                          small={file.thumbnail_small_url ?? null}
                          full={
                            (file.thumbnail_medium_url ??
                              file.file_url) as string
                          }
                          dominant_color={file.dominant_color ?? undefined}
                        />
                      )}
                      {file.category === 'video' && (
                        <VideoLayout
                          full={(file.file_url ?? '') as string}
                          has_audio={!!file.has_audio}
                          // className={styles.mediaItem}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'audio' && audioFiles.length > 0 && (
                <div className={styles.audioGrid}>
                  {audioFiles.map((file: File) => (
                    <AudioLayout
                      key={file.id}
                      waveform={file.waveform || null}
                      duration={file.duration || 0}
                      id={file.id || 0}
                      cover_url={file.cover_url || null}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          {interlocutorEditVisible && (
            <div className={`${styles.interlocutorEdit} ${styles.visible}`}>
              <div className={styles.form}>
                {selectedChat.type === 'D' && (
                  <>
                    <Input
                      placeholder='Username'
                      isRequired
                      value={editValue}
                      onChange={setValue}
                    />
                    {/* <Input
                    placeholder='Last Name'
                    value={editValue}
                    onChange={setValue}
                  />
                  <Input
                    placeholder='Notes'
                    value={editValue}
                    onChange={setValue}
                  /> */}
                  </>
                )}
                {selectedChat.type === 'G' && (
                  <>
                    <Input
                      placeholder='Group Name'
                      isRequired
                      value={editValue}
                      onChange={setValue}
                    />
                    {/* <Input placeholder='Description' /> */}
                  </>
                )}

                <Button
                  className={`${styles.button} ${styles.save}`}
                  type='button'
                  onClick={() =>
                    saveContact(interlocutor?.contact_id, editValue)
                  }
                >
                  {t('buttons.save')}
                </Button>
                <Button
                  className={`${styles.button} ${styles.delete}`}
                  type='button'
                  onClick={() => {
                    deleteContact(interlocutor?.contact_id);
                    setInterlocutorEditVisible(false);
                  }}
                >
                  Delete from Contacts
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SideBarMedia;
