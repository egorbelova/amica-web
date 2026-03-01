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
  isLastMessage?: boolean;
}

const Message: React.FC<MessageProps> = ({
  message,
  onContextMenu,
  onTouchStart,
  onTouchEnd,
}) => {
  const messageRef = useRef<HTMLDivElement>(null);
  const dimensions = useMessageDimensions(messageRef);

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

  const containerStyle = useMemo(
    () =>
      dimensions.width != null
        ? {
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
          }
        : undefined,
    [dimensions.width, dimensions.height],
  );

  return (
    <div
      className={`temp_full ${isOwn ? 'own-message' : 'other-message'}`}
      onContextMenu={onContextMenu}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        className={`${styles.message_div} ${isOwn ? `${styles.darker} ${styles.right}` : ''}`}
        style={containerStyle}
      >
        <MessageContent
          ref={messageRef}
          message={message}
          isOwn={isOwn}
          hasOnlyMediaFiles={hasOnlyMediaFiles}
        />
      </div>
    </div>
  );
};

function areEqual(prev: MessageProps, next: MessageProps): boolean {
  return (
    prev.message === next.message && prev.isLastMessage === next.isLastMessage
  );
}

export default React.memo(Message, areEqual);
