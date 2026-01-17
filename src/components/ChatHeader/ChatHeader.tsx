import React, { useState, useEffect } from 'react';
import Icon from '../Icon/Icon';
import { useChat } from '../../contexts/ChatContext';
import { useUser } from '../../contexts/UserContext';
import Avatar from '../Avatar/Avatar';
import { formatLastSeen } from '../../utils/activityFormatter';
import styles from './ChatHeader.module.scss';
import './ChatHeader.css';

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

  const handleGoHome = (e: React.MouseEvent) => {
    e.stopPropagation();
    onGoHome?.();
  };

  if (!selectedChat) {
    return;
  }

  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const avatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAvatarModalVisible(true);
  };

  const [subtitle, setSubtitle] = useState('');

  useEffect(() => {
    //@ts-ignore
    if (selectedChat.chat_type === 'G') {
      // @ts-ignore
      setSubtitle(`${selectedChat.info} members`);
    } else {
      // @ts-ignore
      setSubtitle(formatLastSeen(selectedChat.info));
    }
  }, [selectedChat, user]);

  return (
    <div id='opponent_title_name' onClick={onChatInfoClick}>
      <div
        className='go_home_page'
        onClick={handleGoHome}
        role='button'
        tabIndex={0}
        // onKeyDown={(e) => e.key === 'Enter' && handleGoHome()}
        aria-label='Go back to home'
      >
        <Icon name='arrow' className='arrow-left' />
      </div>

      <div id='name'>
        <span className='title_name'>{selectedChat.name}</span>
        {subtitle && <span className='title_name_subtitle'>{subtitle}</span>}
      </div>

      <div className='opponent_photo_div'>
        <Avatar
          key={selectedChat.id}
          // @ts-ignore
          displayName={selectedChat.name}
          // @ts-ignore
          displayMedia={selectedChat.primary_media}
          className={styles.avatar}
          onClick={avatarClick}
        />

        {avatarModalVisible && (
          <Avatar
            // @ts-ignore
            displayName={selectedChat.display_name}
            // @ts-ignore
            displayMedia={selectedChat.primary_media}
            className='user-info-avatar big'
          />
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
