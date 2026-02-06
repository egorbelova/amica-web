import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  useMemo,
  useTransition,
} from 'react';
import type { ReactNode } from 'react';
import type { Message, Chat, User } from '@/types';
import { websocketManager } from '@/utils/websocket-manager';
import { apiFetch } from '@/utils/apiFetch';

interface ChatContextType {
  selectedChat: Chat | null;
  messages: Message[];
  chats: Chat[];
  loading: boolean;
  messagesCache: { [roomId: number]: Message[] };
  error: string | null;

  selectChat: (chatId: number | null) => void;
  updateMessages: (messages: Message[], chatId: number) => void;
  setChats: (chats: Chat[]) => void;
  setLoading: (loading: boolean) => void;
  getCachedMessages: (roomId: number) => Message[] | null;
  updateChatLastMessage: (chatId: number, lastMessage: Message | null) => void;
  updateChatUnreadCount: (chatId: number, unreadCount: number) => void;

  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: number) => Promise<void>;
  handleChatClick: (chatId: number) => Promise<void>;
  handleCreateTemporaryChat: (user: User) => void;
  setSelectedChatId: (chatId: number | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messagesCache, setMessagesCache] = useState<{
    [roomId: number]: Message[];
  }>({});

  const messages = selectedChatId ? (messagesCache[selectedChatId] ?? []) : [];

  const selectedChat = useMemo(
    () => chats.find((c) => c.id === selectedChatId) ?? null,
    [chats, selectedChatId],
  );

  const selectChat = useCallback((chatId: number | null) => {
    setSelectedChatId(chatId);
  }, []);

  useEffect(() => {
    const handleNewMessage = (data: any) => {
      if (data.type === 'chat_message' && data.chat_id && data.data) {
        const roomId = data.chat_id;
        const newMessage = data.data;

        console.log('New message received for room:', data);

        setChats((prevChats) => {
          return prevChats.map((chat) =>
            chat.id === roomId
              ? {
                  ...chat,
                  last_message: newMessage,
                }
              : chat,
          );
        });

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
    };

    websocketManager.on('chat_message', handleNewMessage);
    return () => {
      websocketManager.off('chat_message', handleNewMessage);
    };
  }, []);

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
            chat.id === chatId
              ? {
                  ...chat,
                  last_message: lastMessage,
                }
              : chat,
          );
        });
      }
    },
    [],
  );

  const getCachedMessages = useCallback(
    (roomId: number) => {
      return messagesCache[roomId] || null;
    },
    [messagesCache],
  );

  const updateChatLastMessage = useCallback(
    (chatId: number, lastMessage: Message | null) => {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === chatId ? { ...chat, last_message: lastMessage } : chat,
        ),
      );
    },
    [],
  );

  const updateChatUnreadCount = useCallback(
    (chatId: number, unreadCount: number) => {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === chatId ? { ...chat, unread_count: unreadCount } : chat,
        ),
      );
    },
    [],
  );

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch('/api/get_chats/', {
        method: 'GET',
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();

      setChats(Array.isArray(data.chats) ? data.chats : []);
      const hashRoomId = location.hash
        ? Number(location.hash.substring(1))
        : null;
      if (hashRoomId) {
        setSelectedChatId(hashRoomId);
        fetchMessages(hashRoomId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedChatId(null);
        location.hash = '';
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const fetchMessages = useCallback(
    async (chatId: number) => {
      try {
        const res = await apiFetch(`/api/get_chat/${chatId}/`);
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const data = await res.json();
        // console.log('Fetched chat:', data.chat);
        if (data.chat.media) {
          setChats((prevChats) => {
            const updatedChats = prevChats.map((chat) =>
              chat.id === chatId
                ? { ...chat, media: data.chat.media, users: data.chat.users }
                : chat,
            );
            return updatedChats;
          });
        }
        updateMessages(data.chat.messages || [], chatId);
      } catch (err) {
        console.error(err);
        updateMessages([], chatId);
      }
    },
    [updateMessages],
  );

  const handleCreateTemporaryChat = useCallback(
    (user: User) => {
      const tempId = Math.min(...chats.map((c) => c.id), 0) - 1;
      const tempChat: Chat = {
        id: tempId,
        info: user.username,
        name: user.username,
        members: [user],
        last_message: null,
        unread_count: 0,
        type: 'D',
        primary_media: user.profile?.primary_avatar || null,
      };

      setChats((prev) => [tempChat, ...prev]);

      selectChat(tempId);
    },
    [chats, selectChat],
  );

  const [isPending, startTransition] = useTransition();

  const handleChatClick = useCallback(
    async (chatId: number) => {
      if (chatId === selectedChatId) return;
      setSelectedChatId(chatId);

      startTransition(() => {
        fetchMessages(chatId);
      });
    },
    [selectedChatId, fetchMessages],
  );

  const value: ChatContextType = {
    selectedChat,
    messages,
    chats,
    loading,
    error,
    messagesCache,
    selectChat,
    updateMessages,
    setChats,
    setLoading,
    getCachedMessages,
    updateChatLastMessage,
    updateChatUnreadCount,
    fetchChats,
    fetchMessages,
    handleChatClick,
    handleCreateTemporaryChat,
    setSelectedChatId,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
