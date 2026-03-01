import Message from '../Message/Message';
import { useChatMeta, useChatMessages } from '@/contexts/ChatContextCore';
import { useEffect, useRef, useState, memo, useCallback, useMemo } from 'react';
import ContextMenu from '../ContextMenu/ContextMenu';
import styles from './MessageList.module.scss';
import { useJump } from '@/hooks/useJump';
import { useMergedRefs } from '@/hooks/useMergedRefs';
import { useCanCopyToClipboard } from '@/hooks/useCanCopyToClipboard';
import { useSnackbar } from '@/contexts/snackbar/SnackbarContextCore';
import type { Message as MessageType, User } from '@/types';
import ViewersList from './ViewersList';
import { useMessageContextMenu } from './useMessageContextMenu';

const MessageList: React.FC = () => {
  const { selectedChat } = useChatMeta();
  const { messages, setEditingMessage, removeMessageFromChat } =
    useChatMessages();
  const { containerRef: jumpContainerRef, setIsVisible } = useJump();
  const { showSnackbar } = useSnackbar();
  const canCopyToClipboard = useCanCopyToClipboard();

  const [viewersVisible, setViewersVisible] = useState(false);
  const [currentViewers, setCurrentViewers] = useState<User[]>([]);

  const handleShowViewers = useCallback((msg: MessageType) => {
    setCurrentViewers(msg.viewers || []);
    setViewersVisible(true);
  }, []);

  const handleViewersClose = useCallback(() => setViewersVisible(false), []);

  const {
    menuItems,
    menuPos,
    menuVisible,
    isMenuHiding,
    handleClose,
    handleAnimationEnd,
    handleMessageContextMenu,
    handleTouchStart,
    handleTouchEnd,
  } = useMessageContextMenu({
    selectedChat,
    setEditingMessage,
    removeMessageFromChat,
    showSnackbar,
    canCopyToClipboard,
    onShowViewers: handleShowViewers,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRefs([containerRef, jumpContainerRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => setIsVisible(el.scrollTop < -50);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [setIsVisible]);

  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  return (
    <div className='room_div' ref={mergedRef}>
      {menuVisible && (
        <ContextMenu
          items={menuItems}
          position={menuPos || { x: 0, y: 0 }}
          onClose={handleClose}
          onAnimationEnd={handleAnimationEnd}
          isHiding={isMenuHiding}
        />
      )}
      {viewersVisible && (
        <ViewersList viewers={currentViewers} onClose={handleViewersClose} />
      )}

      {messages.length === 0 && (
        <div className={styles['no-messages']}>No messages yet</div>
      )}
      {reversedMessages.map((message) =>
        message.value || message.files?.length ? (
          <Message
            key={message.id}
            message={message}
            onContextMenu={(e) => handleMessageContextMenu(e, message)}
            onTouchStart={(e) => handleTouchStart(e, message)}
            onTouchEnd={handleTouchEnd}
            isLastMessage={false}
          />
        ) : null,
      )}
    </div>
  );
};

export default memo(MessageList);
