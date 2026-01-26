import React, { forwardRef, useRef } from 'react';
import { lastMessageDateFormat, unreadCountFormat } from '../../utils/index';
import Avatar from '../Avatar/Avatar';
import styles from './ChatListItem.module.scss';
// import { SquircleContainer } from '../SquircleContainer/SquircleContainer';
import AttachmentPreview from './AttachmentPreview';

export interface ChatListItemProps {
  index?: number;
  chatId: number;
  displayPrimaryMedia?: string;
  displayName: string;
  lastMessage: any | null;
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

    const lastMessageText = lastMessage && lastMessage.value;

    const lastMessageFiles = (lastMessage?.files || [])
      .filter((file) => file.category === 'video' || file.category === 'image')
      .slice(0, 3);

    const unread_counter = unreadCountFormat(unread_count);
    const goToChat = (
      e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    ): void => {
      e.preventDefault();
      e.stopPropagation();
      onChatClick(chatId);

      const ripple = document.createElement('span');
      ripple.className = styles.ripple;

      const rect = container.current!.getBoundingClientRect();
      ripple.style.left = e.clientX - rect.left + 'px';
      ripple.style.top = e.clientY - rect.top + 'px';

      container.current!.appendChild(ripple);

      ripple.addEventListener('animationend', () => {
        ripple.remove();
      });
    };

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
          //@ts-ignore
          displayMedia={displayPrimaryMedia}
          className={styles['chat-list-item__avatar']}
        />

        <div className={styles['chat-list-item__content']}>
          <div className={styles['chat-list-item__header']}>
            <div className={styles['chat-list-item__name']}>{displayName}</div>
            <div className={styles['chat-list-item__date']}>
              {lastMessageDate}
            </div>
          </div>
          <div className={styles['chat-list-item__message-row']}>
            <div className={styles['chat-list-item__message-text']}>
              {lastMessageFiles.length > 0 && (
                <div className={styles['chat-list-item__attachments']}>
                  {lastMessageFiles.map((file, index) => (
                    <AttachmentPreview key={file.id || index} file={file} />
                  ))}
                </div>
              )}

              {lastMessage &&
                (lastMessageText
                  ? lastMessageText
                  : `${lastMessageFiles.length} Photos`)}
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
