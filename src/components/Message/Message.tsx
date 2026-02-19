import MessageTime from '../Message/MessageTime';
import type { Message as MessageType } from '../../types';
import styles from './Message.module.scss';
import { Icon } from '../Icons/AutoIcons';
import SmartMediaLayout from './SmartMediaLayout.tsx';

interface MessageProps {
  message: MessageType;
  onContextMenu?: (e: React.MouseEvent) => void;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLDivElement>) => void;
  isLastMessage?: boolean;
}

const Message: React.FC<MessageProps> = ({
  message,
  onContextMenu,
  onPointerDown,
  onPointerUp,
}) => {
  const isOwnMessage = (): boolean => {
    return message.is_own;
  };
  const isMessageViewed = (): boolean => message.viewers?.length > 0;

  const handleMessageClick = () => {
    if (!isOwnMessage() && !isMessageViewed()) {
    }
  };

  const hasOnlyMediaFiles =
    Array.isArray(message.files) &&
    message.files.length > 0 &&
    message.files.every(
      (file) => file.category === 'image' || file.category === 'video',
    );

  const handleDoubleClick = () => {};
  return (
    <div
      className={`temp_full ${
        isOwnMessage() ? 'own-message' : 'other-message'
      }`}
      onClick={handleMessageClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={onContextMenu}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {/* {!isOwnMessage() && (
        <Avatar
          className={styles.avatar}
          displayName={message.user.username}
          displayMedia={message.user.profile.primary_avatar}
        />
      )} */}
      <div
        className={`${styles.message_div} ${
          isOwnMessage() ? `${styles.darker} ${styles.right}` : ''
        }`}
      >
        <div className={styles.message}>
          {message.files && message.files.length > 0 && (
            <SmartMediaLayout files={message.files} />
          )}

          <div
            className={`${styles.message_div_temp_separator} ${
              !message.value ? styles.textEmpty : ''
            } ${!message.value && hasOnlyMediaFiles ? styles.hasOnlyMediaFiles : ''}`}
          >
            <div className='message_and_reaction'>
              {message.value && (
                <span className={styles.message__text}>{message.value}</span>
              )}
              {message.liked > 0 && <div className='message-reaction'>❤️</div>}
            </div>

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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;
