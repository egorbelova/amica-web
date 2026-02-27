import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import { lastMessageDateFormat, unreadCountFormat } from '../../utils/index';
import Avatar from '../Avatar/Avatar';
import styles from './ChatListItem.module.scss';
import type { DisplayMedia, File, Message } from '@/types';
import AttachmentPreview from './AttachmentPreview';
import { Icon } from '../Icons/AutoIcons';

export interface ChatListItemProps {
  index?: number;
  chatId: number;
  displayPrimaryMedia?: DisplayMedia;
  displayName: string;
  lastMessage: Message | null;
  unread_count: number;
  isActive: boolean;
  onChatClick: (chatId: number) => void;
}

const ChatListItem = forwardRef<HTMLAnchorElement, ChatListItemProps>(
  (
    {
      index,
      chatId,
      displayPrimaryMedia,
      displayName,
      lastMessage,
      unread_count,
      isActive,
      onChatClick,
    },
    ref,
  ) => {
    const lastMessageDate =
      lastMessage && lastMessageDateFormat(lastMessage.date);
    const container = useRef<HTMLAnchorElement>(null);

    useImperativeHandle(ref, () => container.current as HTMLAnchorElement);

    const lastMessageText = lastMessage && lastMessage.value;

    const lastMessageFiles = (lastMessage?.files || [])
      .filter(
        (file: File) =>
          file.category === 'video' ||
          file.category === 'image' ||
          file.category === 'audio',
      )
      .slice(0, 3);

    const unread_counter = unreadCountFormat(unread_count);
    const goToChat = (
      e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    ): void => {
      e.preventDefault();
      e.stopPropagation();

      const ripple = document.createElement('span');
      ripple.className = styles.ripple;

      const rect = container.current!.getBoundingClientRect();
      ripple.style.left = e.clientX - rect.left + 'px';
      ripple.style.top = e.clientY - rect.top + 'px';

      container.current!.appendChild(ripple);

      ripple.addEventListener('animationend', () => {
        ripple.remove();
      });

      // Defer to avoid [Violation] 'mousedown' handler took Nms (onChatClick triggers setState + fetch)
      const id = chatId;
      setTimeout(() => {
        onChatClick(id);
      }, 0);
    };
    const getAttachmentText = (files: File[] = []) => {
      if (!files.length) return '';
      const isImage = (f: File) => f.category === 'image';
      const isVideo = (f: File) => f.category === 'video';
      const isAudio = (f: File) => f.category === 'audio';

      const allImages = files.every(isImage);
      const allVideos = files.every(isVideo);
      const allAudios = files.every(isAudio);

      if (allImages) {
        return files.length === 1 ? 'Photo' : 'Photos';
      }

      if (allVideos) {
        return files.length === 1 ? 'Video' : 'Videos';
      }

      if (allAudios) {
        return files.length === 1 ? files[0].original_name || '' : 'Audio';
      }

      return 'Media';
    };

    const attachment_text = lastMessage
      ? getAttachmentText(lastMessage.files)
      : '';

    return (
      <a
        href={`#${chatId}`}
        className={`${styles['chat-list-item']} ${
          isActive ? styles['chat-list-item--active'] : ''
        }`}
        onMouseDown={goToChat}
        style={{ '--index': `${index}` } as React.CSSProperties}
        ref={container}
      >
        <Avatar
          displayName={displayName}
          displayMedia={displayPrimaryMedia}
          className={styles['chat-list-item__avatar']}
        />

        <div className={styles['chat-list-item__content']}>
          <div className={styles['chat-list-item__header']}>
            <div className={styles['chat-list-item__name']}>{displayName}</div>
            {lastMessage?.is_own &&
              (lastMessage?.is_viewed ? (
                <Icon name='Read' className={styles['chat-list-item__read']} />
              ) : (
                <Icon
                  name='Unread'
                  className={styles['chat-list-item__read']}
                  style={{ width: '12px', height: '12px' }}
                />
              ))}
            <div className={styles['chat-list-item__date']}>
              {lastMessageDate}
            </div>
          </div>
          <div className={styles['chat-list-item__message-row']}>
            <div className={styles['chat-list-item__message-text']}>
              {lastMessageFiles.length > 0 && (
                <span className={styles['chat-list-item__attachments']}>
                  {lastMessageFiles.map((file: File, index: number) => (
                    <AttachmentPreview key={file.id || index} file={file} />
                  ))}
                </span>
              )}
              {/* <span className={styles['chat-list-item__message-text-content']}> */}
              {lastMessage &&
                (lastMessageText
                  ? lastMessageText
                  : `${lastMessageFiles.length === 1 ? '' : lastMessage.files.length} ${attachment_text}`)}
              {/* </span> */}
            </div>
            {unread_count > 0 && (
              <span className={styles['chat-list-item__unread']}>
                {unread_counter}
              </span>
            )}
          </div>
        </div>
      </a>
    );
  },
);

ChatListItem.displayName = 'ChatListItem';

export default ChatListItem;
