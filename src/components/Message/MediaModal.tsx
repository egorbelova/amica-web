import React from 'react';
import styles from './MediaModal.module.scss';
import type { File } from '@/types';

interface MediaModalProps {
  file: File;
  onClose: () => void;
  containerRect?: DOMRect | null;
}

const MediaModal: React.FC<MediaModalProps> = ({
  file,
  onClose,
  containerRect,
}) => {
  const animateFrom: React.CSSProperties = containerRect
    ? {
        position: 'fixed',
        top: containerRect.top,
        left: containerRect.left,
        width: containerRect.width,
        height: containerRect.height,
        transformOrigin: 'center center',
      }
    : {};

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${styles.animateIn}`}
        style={animateFrom}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.close} onClick={onClose}>
          ×
        </button>

        <div className={styles.mediaContainer}>
          {file.category === 'video' ? (
            <video
              src={file.file_url}
              autoPlay
              controls
              className={styles.fullMedia}
            />
          ) : (
            <img
              src={file.thumbnail_medium_url || file.file_url}
              className={styles.fullMedia}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaModal;
