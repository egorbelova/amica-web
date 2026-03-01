import React, { memo } from 'react';
import { createPortal } from 'react-dom';
import Avatar from '../Avatar/Avatar';
import type { User } from '@/types';
import styles from './MessageList.module.scss';

interface ViewersListProps {
  viewers: User[];
  onClose: () => void;
}

const ViewersList: React.FC<ViewersListProps> = ({ viewers, onClose }) => {
  return createPortal(
    <div className={styles['viewers-list-overlay']} onClick={onClose}>
      <div
        className={styles['viewers-list']}
        onClick={(e) => e.stopPropagation()}
      >
        <h4>Seen by:</h4>
        {viewers.map((v) => (
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

export default memo(ViewersList);
