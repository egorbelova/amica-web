import React, { memo } from 'react';
import { createPortal } from 'react-dom';
import Avatar from '../Avatar/Avatar';
import { useTranslation } from '@/contexts/languageCore';
import { useSelectedChat } from '@/contexts/ChatContextCore';
import type { Viewer } from '@/types';
import styles from './ViewersList.module.scss';

const formatDate = (date: string) => {
  return `${new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} at ${new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

interface ViewersListProps {
  viewers: Viewer[];
  onClose: () => void;
  menuPosition: { x: number; y: number };
}

const ViewersList: React.FC<ViewersListProps> = ({
  viewers,
  onClose,
  menuPosition,
}) => {
  const { t } = useTranslation();
  const { selectedChat } = useSelectedChat();

  const viewer = selectedChat?.members?.find(
    (v) => v.id === viewers[0].user.id,
  );

  return createPortal(
    <div
      className={styles['viewers-list-overlay']}
      onClick={onClose}
      style={{ left: menuPosition.x, top: menuPosition.y }}
    >
      <div className={styles['viewers-list']} onClick={onClose}>
        <div className={styles['viewers-list-title']}>
          {t('messageContextMenu.seenBy')}
        </div>
        {viewers.map((v) => (
          <div key={viewer?.id} className={styles['viewer-item']}>
            <Avatar
              displayName={viewer?.username}
              displayMedia={viewer?.profile.primary_media}
              className={styles['user-info-avatar']}
            />
            <div className={styles['viewer-info']}>
              <span className={styles['viewer-name']}>{viewer?.username}</span>
              <span className={styles['viewer-time']}>
                {formatDate(v.read_date)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>,
    document.body,
  );
};

export default memo(ViewersList);
