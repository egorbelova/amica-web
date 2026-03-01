import React, {
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
  memo,
  useMemo,
  useState,
} from 'react';
import ChatListItem from './ChatListItem';
import { useChatMeta } from '../../contexts/ChatContextCore';
import type { Chat, DisplayMedia } from '../../types';
import styles from './ChatList.module.scss';
import { useSearchContext } from '@/contexts/search/SearchContextCore';

const ChatList: React.FC = () => {
  const { chats, selectedChat, loading, error, fetchChats, handleChatClick } =
    useChatMeta();

  const { term } = useSearchContext();

  const loadingContainerRef = useRef<HTMLDivElement>(null);
  const chatListRef = useRef<HTMLDivElement>(null);
  const chatItemsRef = useRef<Map<number, HTMLAnchorElement>>(new Map());

  const [animatedChats, setAnimatedChats] = useState<Chat[]>([]);
  const prevChatIdsRef = useRef<number[]>([]);

  const setChatItemRef = useCallback(
    (chatId: number, element: HTMLAnchorElement | null) => {
      if (element) chatItemsRef.current.set(chatId, element);
      else chatItemsRef.current.delete(chatId);
    },
    [],
  );

  const sortedChats = useMemo(() => {
    if (!chats.length) return [];

    return [...chats].sort((a, b) => {
      const dateA = a.last_message
        ? new Date(a.last_message.date).getTime()
        : 0;
      const dateB = b.last_message
        ? new Date(b.last_message.date).getTime()
        : 0;

      if (dateA === 0 && dateB === 0) return 0;
      if (dateA === 0) return 1;
      if (dateB === 0) return -1;

      return dateB - dateA;
    });
  }, [chats]);

  useLayoutEffect(() => {
    if (!sortedChats.length) {
      requestAnimationFrame(() => {
        setAnimatedChats([]);
        prevChatIdsRef.current = [];
      });
      return;
    }

    const currentChatIds = sortedChats.map((chat) => chat.id);
    const prevChatIds = prevChatIdsRef.current;

    if (prevChatIds.length === 0) {
      requestAnimationFrame(() => {
        setAnimatedChats(sortedChats);
        prevChatIdsRef.current = currentChatIds;
      });
      return;
    }
    const orderChanged =
      prevChatIds.length !== currentChatIds.length ||
      prevChatIds.some((id, index) => id !== currentChatIds[index]);

    if (!orderChanged) {
      requestAnimationFrame(() => {
        setAnimatedChats(sortedChats);
      });
      return;
    }

    const prevPositions = new Map<number, DOMRect>();
    chatItemsRef.current.forEach((el, id) => {
      prevPositions.set(id, el.getBoundingClientRect());
    });

    requestAnimationFrame(() => {
      setAnimatedChats(sortedChats);
      prevChatIdsRef.current = currentChatIds;
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        chatItemsRef.current.forEach((el, id) => {
          const prevRect = prevPositions.get(id);
          if (!prevRect) return;

          const newRect = el.getBoundingClientRect();
          const dx = prevRect.left - newRect.left;
          const dy = prevRect.top - newRect.top;

          if (dx !== 0 || dy !== 0) {
            el.style.transition = 'none';
            el.style.transform = `translate(${dx}px, ${dy}px)`;

            void el.offsetHeight;

            requestAnimationFrame(() => {
              el.style.transition = 'transform 0.3s ease';
              el.style.transform = '';
            });
          }
        });
      });
    });
  }, [sortedChats]);

  const isActive = !loading && chats.length > 0 && term.length === 0;

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);
  if (loading)
    return (
      <div className='loading_chats_container' ref={loadingContainerRef}>
        <div className='loading-text'>Loading chats...</div>
      </div>
    );

  if (error)
    return (
      <div className='error-container'>
        <div className='error-message'>{error}</div>
        <button onClick={fetchChats} className='retry-button'>
          Try Again
        </button>
      </div>
    );

  if (animatedChats.length === 0) {
    return (
      <div className='no-chats'>
        <div className='no-chats-text'>No chats</div>
      </div>
    );
  }

  return (
    <div
      ref={chatListRef}
      className={`${styles['chat-list-view']} ${
        isActive ? styles['chat-list-view--active'] : ''
      }`}
    >
      {animatedChats.length === 0 ? (
        <div className='no-chats'>
          <div className='no-chats-text'>No chats found</div>
          <button onClick={fetchChats} className='retry-button'>
            Refresh
          </button>
        </div>
      ) : (
        animatedChats.map((chat, index) => (
          <MemoizedChatListItem
            key={chat.id}
            chatId={chat.id}
            displayPrimaryMedia={chat.primary_media as DisplayMedia}
            displayName={chat.name || ''}
            lastMessage={chat.last_message}
            unread_count={chat.unread_count}
            isActive={selectedChat?.id === chat.id}
            onChatClick={handleChatClick}
            ref={(el) => setChatItemRef(chat.id, el)}
            index={index}
          />
        ))
      )}
    </div>
  );
};

export default ChatList;

const MemoizedChatListItem = memo(ChatListItem);
