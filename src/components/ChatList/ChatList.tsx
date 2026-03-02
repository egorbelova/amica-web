import React, { memo, useLayoutEffect, useRef } from 'react';
import ChatListItem from './ChatListItem';
import { useChatMeta, useSelectedChat } from '@/contexts/ChatContextCore';
import type { Chat, DisplayMedia } from '@/types';
import styles from './ChatList.module.scss';
import { useSearchContext } from '@/contexts/search/SearchContextCore';
import { useSortedChats } from './useSortedChats';
import { useAnimatedChatOrder } from './useAnimatedChatOrder';
import {
  ChatListLoading,
  ChatListError,
  ChatListEmpty,
} from './ChatListStates';

const MemoizedChatListItem = memo(ChatListItem);
const ChatListContent = memo(function ChatListContent({
  displayChats,
  selectedChatId,
  setChatItemRef,
  onChatClick,
}: {
  displayChats: Chat[];
  selectedChatId: number | null;
  setChatItemRef: (chatId: number, el: HTMLAnchorElement | null) => void;
  onChatClick: (chatId: number) => void;
}) {
  return (
    <>
      {displayChats.map((chat, index) => (
        <MemoizedChatListItem
          key={chat.id}
          chatId={chat.id}
          displayPrimaryMedia={chat.primary_media as DisplayMedia}
          displayName={chat.name || ''}
          lastMessage={chat.last_message}
          unread_count={chat.unread_count}
          isActive={selectedChatId === chat.id}
          onChatClick={onChatClick}
          ref={(el) => setChatItemRef(chat.id, el)}
          index={index}
        />
      ))}
    </>
  );
});

function ChatList() {
  const { chats, loading, error, fetchChats, handleChatClick } = useChatMeta();
  const { selectedChatId } = useSelectedChat();
  const { term } = useSearchContext();

  const sortedChats = useSortedChats(chats);
  const { displayChats, setChatItemRef } = useAnimatedChatOrder(sortedChats);

  useLayoutEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const chatListRef = useRef<HTMLDivElement>(null);
  const isActive = !loading && chats.length > 0 && term.length === 0;
  const isEmpty = displayChats.length === 0;

  if (loading) return <ChatListLoading />;
  if (error) return <ChatListError message={error} onRetry={fetchChats} />;
  if (sortedChats.length === 0 && isEmpty) {
    return <ChatListEmpty text='No chats' />;
  }

  return (
    <div
      ref={chatListRef}
      className={`${styles['chat-list-view']} ${
        isActive ? styles['chat-list-view--active'] : ''
      }`}
    >
      {isEmpty ? (
        <ChatListEmpty
          text='No chats found'
          showRefresh
          onRefresh={fetchChats}
        />
      ) : (
        <ChatListContent
          displayChats={displayChats}
          selectedChatId={selectedChatId}
          setChatItemRef={setChatItemRef}
          onChatClick={handleChatClick}
        />
      )}
    </div>
  );
}

export default memo(ChatList);
