import React, { useRef, useMemo } from 'react';
import type { Message as MessageType } from '@/types';
import styles from './Message.module.scss';
import { useMessageDimensions } from './useMessageDimensions';
import MessageContent from './MessageContent';

export interface MessageProps {
  message: MessageType;
  onContextMenu?: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd?: (e: React.TouchEvent<HTMLDivElement>) => void;
}

const Message: React.FC<MessageProps> = ({
  message,
  onContextMenu,
  onTouchStart,
  onTouchEnd,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useMessageDimensions(containerRef);

  const isOwn = message.is_own;
  const hasOnlyMediaFiles = useMemo(
    () =>
      Array.isArray(message.files) &&
      message.files.length > 0 &&
      message.files.every(
        (file) => file.category === 'image' || file.category === 'video',
      ),
    [message.files],
  );

  return (
    <div
      className={`temp_full ${isOwn ? 'own-message' : 'other-message'}`}
      onContextMenu={onContextMenu}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        ref={containerRef}
        className={`${styles.message_div} ${isOwn ? `${styles.darker} ${styles.right}` : ''}`}
      >
        <MessageContent
          message={message}
          isOwn={isOwn}
          hasOnlyMediaFiles={hasOnlyMediaFiles}
        />
      </div>
    </div>
  );
};

export default React.memo(Message);
