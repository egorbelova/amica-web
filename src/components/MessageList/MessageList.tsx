import Message from '../Message/Message';
import { useChat } from '@/contexts/ChatContextCore';
import { useEffect, useRef, useState } from 'react';
import ContextMenu from '../ContextMenu/ContextMenu';
import styles from './MessageList.module.scss';
import { createPortal } from 'react-dom';
import Avatar from '../Avatar/Avatar';
import { useJump } from '@/hooks/useJump';
import { useMergedRefs } from '@/hooks/useMergedRefs';
import type { MenuItem } from '../ContextMenu/ContextMenu';
import type { IconName } from '../Icons/AutoIcons';
import { apiFetch } from '@/utils/apiFetch';
import { useSnackbar } from '@/contexts/snackbar/SnackbarContextCore';
import type { Message as MessageType, File, User } from '@/types';

const MessageList: React.FC = () => {
  const { messages, selectedChat, setEditingMessage } = useChat();
  const selectedChatRef = useRef(selectedChat);
  const messagesRef = useRef(messages);
  const { containerRef: jumpContainerRef, setIsVisible } = useJump();
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    selectedChatRef.current = selectedChat;
    messagesRef.current = messages;
  }, [selectedChat, messages]);

  const [viewersVisible, setViewersVisible] = useState(false);
  const [currentViewers, setCurrentViewers] = useState<User[]>([]);

  const handleShowViewers = (msg: MessageType) => {
    setCurrentViewers(msg.viewers || []);
    setViewersVisible(true);
  };

  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isMenuHiding, setIsMenuHiding] = useState(false);

  const handleClose = () => {
    setIsMenuHiding(true);
  };

  const handleAnimationEnd = () => {
    if (isMenuHiding) {
      setIsMenuHiding(false);
      setMenuVisible(false);
    }
  };

  const handleCopyMedia = async (msg: MessageType) => {
    if (!msg?.files?.length) return;

    const firstFile = msg.files.find((file: File) => file.category === 'image');
    if (!firstFile) return;

    try {
      const response = await apiFetch(firstFile.file_url);
      const blob = await response.blob();

      try {
        const imageBlob = new Blob([blob], { type: 'image/png' });
        const clipboardItem = new ClipboardItem({ 'image/png': imageBlob });
        await navigator.clipboard.write([clipboardItem]);
        showSnackbar('Media copied');
      } catch {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = firstFile.file_url;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);

        const pngBlob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/png'),
        );
        if (!pngBlob) throw new Error('Failed to convert to PNG');

        const clipboardItemPNG = new ClipboardItem({ 'image/png': pngBlob });
        await navigator.clipboard.write([clipboardItemPNG]);
      }
    } catch (err) {
      console.error('Clipboard error:', err);
    }
  };

  const [menuMessage, setMenuMessage] = useState<MessageType | null>(null);
  const [canCopyToClipboard, setCanCopyToClipboard] = useState(false);

  useEffect(() => {
    const checkClipboardAccess = async () => {
      try {
        if (!navigator.clipboard || !navigator.clipboard.write) {
          setCanCopyToClipboard(false);
          return;
        }

        if (navigator.permissions) {
          try {
            const result = await navigator.permissions.query({
              name: 'clipboard-write' as PermissionName,
            });
            setCanCopyToClipboard(result.state !== 'denied');
          } catch {
            await testClipboardWrite();
          }
        } else {
          await testClipboardWrite();
        }
      } catch {
        setCanCopyToClipboard(false);
      }
    };

    const testClipboardWrite = async () => {
      try {
        const testBlob = new Blob(['test'], { type: 'text/plain' });
        const testItem = new ClipboardItem({ 'text/plain': testBlob });
        await navigator.clipboard.write([testItem]);
        setCanCopyToClipboard(true);
      } catch {
        setCanCopyToClipboard(false);
      }
    };

    checkClipboardAccess();
  }, []);

  const handleSaveFile = async (msg: MessageType) => {
    if (!msg?.files?.length) return;

    const firstFile = msg.files.length > 0 ? msg.files[0] : null;
    if (!firstFile) return;

    try {
      const response = await apiFetch(firstFile.file_url);
      const blob = await response.blob();

      const filename =
        firstFile.original_name ||
        firstFile.file_url.split('/').pop() ||
        'download';
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      showSnackbar('File downloaded');
      document.body.removeChild(link);

      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download file', err);
      alert('Failed to download file.');
    }
  };

  const menuItems: MenuItem[] = [
    {
      label: 'Reply',
      icon: 'Reply' as IconName,
      onClick: () => alert('Reply clicked'),
    },
    { separator: true, label: '', onClick: () => {} },
    ...(menuMessage?.value
      ? [
          {
            label: 'Copy Text',
            icon: 'CopyText' as IconName,
            onClick: () => handleCopyMessage(menuMessage),
          },
        ]
      : []),
    ...(menuMessage?.files?.some((f: File) =>
      ['image'].includes(f?.category || ''),
    ) && canCopyToClipboard
      ? [
          {
            label: 'Copy Media',
            icon: 'Photo' as IconName,
            onClick: () => handleCopyMedia(menuMessage),
          },
        ]
      : []),
    ...(menuMessage?.files?.length > 0
      ? [
          {
            label: 'Save As...',
            icon: 'SaveAs' as IconName,
            onClick: () => handleSaveFile(menuMessage),
          },
        ]
      : []),
    { separator: true, label: '', onClick: () => {} },
    {
      label: 'Edit',
      icon: 'Edit' as IconName,
      onClick: () => handleEditMessage(menuMessage),
    },
    {
      label: 'Forward',
      icon: 'Forward' as IconName,
      onClick: () => alert('Forward clicked'),
    },
    {
      label: 'Select',
      icon: 'Select' as IconName,
      onClick: () => alert('Select clicked'),
    },
    ...(menuMessage?.viewers?.length && menuMessage?.is_own
      ? [
          { separator: true, label: '', onClick: () => {} },
          {
            label: `${menuMessage.viewers.length} Seen`,
            icon: 'Read' as IconName,
            onClick: () => handleShowViewers(menuMessage),
          },
        ]
      : []),
    { separator: true, label: '', onClick: () => {} },
    {
      label: 'Delete',
      icon: 'Delete' as IconName,
      onClick: () => alert('Delete clicked'),
      danger: true,
    },
  ];

  const handleEditMessage = (msg: MessageType) => {
    setMenuVisible(false);
    setMenuPos(null);
    setEditingMessage(msg);
  };

  const handleCopyMessage = (msg: MessageType) => {
    if (!msg?.value) return;

    const text = msg.value;

    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          showSnackbar('Message copied');
        })
        .catch((err) => {
          console.error('Clipboard error:', err);
          fallbackCopy(text);
        });
    } else {
      fallbackCopy(text);
    }
  };

  function fallbackCopy(text: string) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
    } catch (e) {
      console.error('Fallback copy failed:', e);
    }

    document.body.removeChild(textarea);
  }

  const handleMessageContextMenu = (
    e: React.MouseEvent,
    message: MessageType,
  ) => {
    e.preventDefault();

    setMenuVisible(false);

    setTimeout(() => {
      setMenuMessage(message);
      setMenuPos({ x: e.clientX, y: e.clientY });
      setMenuVisible(true);
      setIsMenuHiding(false);
    }, 0);
  };

  const handleDragStart = (e: React.MouseEvent, msg: MessageType) => {
    timerRef.current = setTimeout(() => {
      setIsLongPress(true);
      handleMessageContextMenu(e, msg);
    }, 200);
  };

  const handleDragEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (!isLongPress) {
      // return;
    }
    setIsLongPress(false);
  };

  const containerRef = useRef<HTMLDivElement>(null);

  const mergedRef = useMergedRefs([containerRef, jumpContainerRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      setIsVisible(el.scrollTop < -50);
    };

    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [setIsVisible]);

  // useEffect(() => {
  //   const el = containerRef.current;
  //   if (!el) return;

  //   el.scrollTo({
  //     top: el.scrollHeight,
  //     // behavior: 'smooth',
  //   });
  // }, [messages]);

  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const messageId = Number(entry.target.getAttribute('data-id'));
          if (entry.isIntersecting && messageId) {
            console.log('Message viewed:', messageId);
          }
        });
      },
      {
        root: containerRef.current,
        threshold: 0.5,
      },
    );

    messageRefs.current.forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [messages]);

  const [isLongPress, setIsLongPress] = useState(false);
  const timerRef = useRef<number | null>(null);

  return (
    <div className='room_div' ref={mergedRef}>
      {menuVisible && (
        <ContextMenu
          items={menuItems}
          position={menuPos || { x: 0, y: 0 }}
          onClose={handleClose}
          onAnimationEnd={handleAnimationEnd}
          isHiding={isMenuHiding}
        />
      )}
      {viewersVisible && (
        <ViewersList
          viewers={currentViewers}
          onClose={() => setViewersVisible(false)}
        />
      )}

      {messages.length === 0 && (
        <div className={styles['no-messages']}>No messages yet</div>
      )}
      {[...messages].reverse().map((message) =>
        message.value || message.files?.length ? (
          <Message
            key={message.id}
            message={message}
            onContextMenu={(e) => handleMessageContextMenu(e, message)}
            onPointerDown={(e) => handleDragStart(e, message)}
            onPointerUp={() => handleDragEnd()}
            // isLastMessage={message.id === lastMessageWithImage?.id}
            isLastMessage={false}
          />
        ) : null,
      )}
    </div>
  );
};

export default MessageList;

const ViewersList: React.FC<{ viewers: User[]; onClose: () => void }> = ({
  viewers,
  onClose,
}) => {
  return createPortal(
    <div className={styles['viewers-list-overlay']} onClick={onClose}>
      <div
        className={styles['viewers-list']}
        onClick={(e) => e.stopPropagation()}
      >
        <h4>Seen by:</h4>
        {viewers.map((v: User) => (
          <div key={v.id} className={styles['viewer-item']}>
            <Avatar
              displayName={v.username}
              displayMedia={v.profile.primary_media}
              className='user-info-avatar'
            />
            <div className={styles['viewer-info']}>
              <span className={styles['viewer-name']}>{v.username}</span>
              <span className={styles['viewer-time']}>
                {new Date(v.last_seen || '').toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>,
    document.body,
  );
};
