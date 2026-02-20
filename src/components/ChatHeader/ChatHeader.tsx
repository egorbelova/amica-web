import React, { useState } from 'react';
import { useChat } from '@/contexts/ChatContextCore';
import Avatar from '../Avatar/Avatar';
import { formatLastSeen } from '../../utils/activityFormatter';
import styles from './ChatHeader.module.scss';
import { Icon } from '../Icons/AutoIcons';
import { MediaHeader } from './MediaHeader';
import Button from '../ui/button/Button';

interface ChatHeaderProps {
  onGoHome?: () => void;
  onChatInfoClick?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  onGoHome,
  onChatInfoClick,
}) => {
  const { selectedChat } = useChat();
  const [, setAvatarModalVisible] = useState(false);

  const subtitle =
    selectedChat?.type === 'G'
      ? `${selectedChat?.info || ''} members`
      : formatLastSeen(selectedChat?.info || '');

  if (!selectedChat) return;

  const handleGoHome = (e: React.MouseEvent) => {
    e.stopPropagation();
    onGoHome?.();
  };

  const avatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAvatarModalVisible(true);
  };

  return (
    <div className={styles['header-container']}>
      <div className={styles['chat-header']} onClick={onChatInfoClick}>
        <Button
          onClick={handleGoHome}
          className={styles['chat-header__back-button']}
        >
          <Icon name='Arrow' />
        </Button>

        <div className={styles['chat-header__title']}>
          <span className={styles['chat-header__title-name']}>
            {selectedChat.name}
          </span>
          {subtitle && (
            <span className={styles['chat-header__title-sub']}>{subtitle}</span>
          )}
        </div>

        <Avatar
          key={selectedChat.id}
          displayName={selectedChat.name || ''}
          displayMedia={selectedChat.primary_media}
          className={styles['chat-header__avatar']}
          onClick={avatarClick}
        />
      </div>
      <MediaHeader />
    </div>
  );
};

export default ChatHeader;
