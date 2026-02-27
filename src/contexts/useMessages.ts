import { useCallback, useState, useEffect, useRef } from 'react';
import type { Message, Chat } from '@/types';
import type { WebSocketMessage } from '@/utils/websocket-manager';
import { websocketManager } from '@/utils/websocket-manager';

export interface UseMessagesParams {
  selectedChatId: number | null;
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
}

export interface UseMessagesReturn {
  messagesCache: { [roomId: number]: Message[] };
  messages: Message[];
  editingMessage: Message | null;
  setEditingMessage: (message: Message | null) => void;
  updateMessages: (messages: Message[], chatId: number) => void;
  updateMessageInChat: (
    chatId: number,
    messageId: number,
    updates: Partial<Message>,
  ) => void;
  getCachedMessages: (roomId: number) => Message[] | null;
  handleNewMessage: (data: WebSocketMessage) => void;
}

export function useMessages({
  selectedChatId,
  setChats,
}: UseMessagesParams): UseMessagesReturn {
  const [messagesCache, setMessagesCache] = useState<{
    [roomId: number]: Message[];
  }>({});
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  const messagesCacheRef = useRef(messagesCache);

  useEffect(() => {
    messagesCacheRef.current = messagesCache;
  }, [messagesCache]);

  const messages = selectedChatId ? (messagesCache[selectedChatId] ?? []) : [];

  const handleNewMessage = useCallback(
    (data: WebSocketMessage) => {
      if (data.type === 'chat_message' && data.chat_id && data.data) {
        const roomId = data.chat_id;
        const newMessage = data.data as unknown as Message;

        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === roomId ? { ...chat, last_message: newMessage } : chat,
          ),
        );

        setMessagesCache((prevCache) => {
          const existingMessages = prevCache[roomId] || [];
          const isDuplicate = existingMessages.some(
            (msg) => msg.id === newMessage.id,
          );
          if (isDuplicate) return prevCache;
          return {
            ...prevCache,
            [roomId]: [...existingMessages, newMessage],
          };
        });
      }
    },
    [setChats],
  );

  useEffect(() => {
    websocketManager.on('chat_message', handleNewMessage);
    return () => {
      websocketManager.off('chat_message', handleNewMessage);
    };
  }, [handleNewMessage]);

  const updateMessages = useCallback(
    (newMessages: Message[], chatId: number) => {
      setMessagesCache((prev) => ({
        ...prev,
        [chatId]: newMessages,
      }));

      if (newMessages.length > 0) {
        const lastMessage = newMessages[newMessages.length - 1];
        setChats((prevChats) => {
          const targetChat = prevChats.find((chat) => chat.id === chatId);
          if (!targetChat) return prevChats;
          const currentLastMessage = targetChat.last_message;
          const shouldUpdate =
            !currentLastMessage || lastMessage.id !== currentLastMessage.id;
          if (!shouldUpdate) return prevChats;
          return prevChats.map((chat) =>
            chat.id === chatId ? { ...chat, last_message: lastMessage } : chat,
          );
        });
      }
    },
    [setChats],
  );

  const updateMessageInChat = useCallback(
    (chatId: number, messageId: number, updates: Partial<Message>) => {
      const mid = Number(messageId);
      setMessagesCache((prev) => {
        const list = prev[chatId] ?? [];
        const newList = list.map((m) =>
          Number(m.id) === mid ? { ...m, ...updates } : m,
        );
        return { ...prev, [chatId]: newList };
      });
    },
    [],
  );

  const getCachedMessages = useCallback((roomId: number) => {
    return messagesCacheRef.current[roomId] || null;
  }, []);

  return {
    messagesCache,
    messages,
    editingMessage,
    setEditingMessage,
    updateMessages,
    updateMessageInChat,
    getCachedMessages,
    handleNewMessage,
  };
}
