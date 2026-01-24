import React, { useState, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useUser } from '../../contexts/UserContext';
import Avatar from '../Avatar/Avatar';
import { formatLastSeen } from '../../utils/activityFormatter';
import styles from './ChatHeader.module.scss';
import { Icon } from '../Icons/AutoIcons';

interface ChatHeaderProps {
  onGoHome?: () => void;
  onChatInfoClick?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  onGoHome,
  onChatInfoClick,
}) => {
  const { selectedChat } = useChat();
  const { user } = useUser();
  const [subtitle, setSubtitle] = useState('');
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  useEffect(() => {
    if (selectedChat.type === 'G') {
      setSubtitle(`${selectedChat.info} members`);
    } else {
      setSubtitle(formatLastSeen(selectedChat.info));
    }
  }, [selectedChat, user]);

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
    <div className={styles['chat-header']} onClick={onChatInfoClick}>
      <button
        onClick={handleGoHome}
        type='button'
        className={styles['chat-header__back-button']}
      >
        <Icon name='Arrow' />
      </button>

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
        displayName={selectedChat.name}
        displayMedia={selectedChat.primary_media}
        className={styles['chat-header__avatar']}
        onClick={avatarClick}
      />
    </div>
  );
};

export default ChatHeader;
