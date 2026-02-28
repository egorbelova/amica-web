import MessageTime from '../Message/MessageTime';
import type { Message as MessageType } from '../../types';
import styles from './Message.module.scss';
import { Icon } from '../Icons/AutoIcons';
import SmartMediaLayout from './SmartMediaLayout.tsx';
import React, { useRef, useState, useLayoutEffect, useMemo } from 'react';

interface MessageProps {
  message: MessageType;
  onContextMenu?: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd?: (e: React.TouchEvent<HTMLDivElement>) => void;
  isLastMessage?: boolean;
}

const Message: React.FC<MessageProps> = ({
  message,
  onContextMenu,
  onTouchStart,
  onTouchEnd,
}) => {
  const messageRef = useRef<HTMLDivElement>(null);

  const isOwnMessage = (): boolean => {
    return message.is_own;
  };
  const isMessageViewed = (): boolean => message.viewers?.length > 0;
  const hasOnlyMediaFiles = useMemo(() => {
    return (
      Array.isArray(message.files) &&
      message.files.length > 0 &&
      message.files.every(
        (file) => file.category === 'image' || file.category === 'video',
      )
    );
  }, [message.files]);

  const handleDoubleClick = () => {};

  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{
    width: number | null;
    height: number | null;
  }>({
    width: null,
    height: null,
  });

  useLayoutEffect(() => {
    const el = messageRef.current;
    if (!el) return;

    const updateSize = () => {
      setDimensions((prev) => {
        if (prev.width !== el.offsetWidth || prev.height !== el.offsetHeight) {
          return { width: el.offsetWidth, height: el.offsetHeight };
        }
        return prev;
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`temp_full ${
        isOwnMessage() ? 'own-message' : 'other-message'
      }`}
      onDoubleClick={handleDoubleClick}
      onContextMenu={onContextMenu}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* {!isOwnMessage() && (
        <Avatar
          className={styles.avatar}
          displayName={message.user.username}
          displayMedia={message.user.profile.primary_media}
        />
      )} */}
      <div
        className={`${styles.message_div} ${
          isOwnMessage() ? `${styles.darker} ${styles.right}` : ''
        }`}
        ref={messageContainerRef}
        style={
          dimensions.width
            ? {
                width: `${dimensions.width}px`,
                height: `${dimensions.height}px`,
              }
            : undefined
        }
      >
        {/* <div className={styles.message_container}> */}
        <div className={styles.message} ref={messageRef}>
          {message.files && message.files.length > 0 && (
            <SmartMediaLayout files={message.files} />
          )}

          <div
            className={`${styles.message_div_temp_separator} ${
              !message.value ? styles.textEmpty : ''
            } ${!message.value && hasOnlyMediaFiles ? styles.hasOnlyMediaFiles : ''}`}
          >
            {/* <div className={styles.message_and_reaction}> */}
            {message.value && (
              <span className={styles.message__text}>{message.value}</span>
            )}
            {/* {message.liked > 0 && <div className='message-reaction'>❤️</div>}
            </div> */}

            <div className={styles.message_div_subdata}>
              <div className='message_div_temp_time_view'>
                <MessageTime date={message.date} />

                <span id='viewed_span' className='viewed-status'>
                  {isOwnMessage() &&
                    (isMessageViewed() ? (
                      <Icon
                        name='Read'
                        className={styles['viewed-status__icon']}
                      />
                    ) : (
                      <Icon
                        name='Unread'
                        className={styles['viewed-status__icon']}
                      />
                    ))}
                </span>
                {/* </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Message);
