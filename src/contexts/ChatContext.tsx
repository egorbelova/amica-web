import React, {
  useCallback,
  useState,
  useEffect,
  useMemo,
  useTransition,
} from 'react';
import type { ReactNode } from 'react';
import type { Message, Chat, User } from '@/types';
import { apiFetch, apiUpload } from '@/utils/apiFetch';
import { websocketManager } from '@/utils/websocket-manager';
import type { WebSocketMessage } from '@/utils/websocket-manager';
import { useSettingsActions } from './settings/context';
import { ChatContext, type ChatContextType } from './ChatContextCore';
import { useMessages } from './useMessages';

export const ChatProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setActiveProfileTab } = useSettingsActions();

  const {
    messagesCache,
    messages,
    editingMessage,
    setEditingMessage,
    updateMessages,
    updateMessageInChat,
    getCachedMessages,
    handleNewMessage,
  } = useMessages({ selectedChatId, setChats });

  const selectedChat = useMemo(
    () => chats.find((c) => c.id === selectedChatId) ?? null,
    [chats, selectedChatId],
  );

  const selectChat = useCallback(
    (chatId: number | null) => {
      setSelectedChatId(chatId);
      setEditingMessage(null);
    },
    [setEditingMessage],
  );

  const fetchChat = useCallback(
    async (chatId: number) => {
      const applyChatData = (data: {
        media?: Chat['media'];
        members?: Chat['members'];
        messages?: Message[];
      }) => {
        if (data.media) {
          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat.id === chatId
                ? {
                    ...chat,
                    media: data.media!,
                    members: data.members ?? chat.members,
                  }
                : chat,
            ),
          );
        }
        updateMessages(data.messages || [], chatId);
      };

      if (websocketManager.isConnected()) {
        const timeoutId = window.setTimeout(() => {
          websocketManager.off('chat', handleChat);
          websocketManager.off('message', handleError);
          apiFetch(`/api/get_chat/${chatId}/`)
            .then((res) => (res.ok ? res.json() : Promise.reject(res)))
            .then(applyChatData)
            .catch(() => updateMessages([], chatId));
        }, 10000);

        const handleChat = (
          data: WebSocketMessage & {
            chat_id?: number;
            media?: Chat['media'];
            members?: Chat['members'];
            messages?: Message[];
          },
        ) => {
          if (data.chat_id !== chatId) return;
          window.clearTimeout(timeoutId);
          websocketManager.off('chat', handleChat);
          websocketManager.off('message', handleError);
          applyChatData(data);
        };

        const handleError = (msg: { type?: string }) => {
          if (msg.type !== 'error') return;
          window.clearTimeout(timeoutId);
          websocketManager.off('chat', handleChat);
          websocketManager.off('message', handleError);
          apiFetch(`/api/get_chat/${chatId}/`)
            .then((res) => (res.ok ? res.json() : Promise.reject(res)))
            .then(applyChatData)
            .catch(() => updateMessages([], chatId));
        };

        websocketManager.on('chat', handleChat);
        websocketManager.on('message', handleError);
        websocketManager.sendMessage({ type: 'get_chat', chat_id: chatId });
        return;
      }

      try {
        const res = await apiFetch(`/api/get_chat/${chatId}/`);
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const data = await res.json();
        applyChatData(data);
      } catch (err) {
        console.error(err);
        updateMessages([], chatId);
      }
    },
    [updateMessages],
  );

  const saveContact = useCallback(
    async (contactId: number, name: string) => {
      if (!selectedChat) return;

      const formData = new FormData();
      formData.append('contact_id', contactId.toString());
      formData.append('name', name);

      const res = await apiFetch('/api/contact/', {
        method: 'PATCH',
        body: formData,
      });

      if (!res.ok) return;

      const updatedMembers = selectedChat.members?.map((u) =>
        u.contact_id === contactId ? { ...u, name } : u,
      );

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === selectedChat.id
            ? { ...chat, members: updatedMembers, name }
            : chat,
        ),
      );
    },
    [selectedChat],
  );

  const deleteContact = useCallback(
    async (contactId: number) => {
      if (!selectedChatId) return;
      const formData = new FormData();
      formData.append('contact_id', contactId.toString());
      await apiFetch('/api/contact/', {
        method: 'DELETE',
        body: formData,
      });

      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id !== selectedChatId) return chat;

          if (!chat.members || chat.members.length === 0) return chat;

          const updatedUsers = chat.members.map((u, index) =>
            index === 0 ? { ...u, is_contact: false } : u,
          );

          return {
            ...chat,
            members: updatedUsers,
          };
        }),
      );
    },
    [selectedChatId],
  );

  const addContact = useCallback(
    async (usedId: number) => {
      if (!selectedChatId) return;
      const formData = new FormData();
      formData.append('user_id', usedId.toString());
      const res: unknown = await apiUpload('/api/contact/', formData);
      if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, unknown>;
        if (typeof r.error === 'string') {
          setError(r.error);
          return;
        }
      }

      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id !== selectedChatId) return chat;

          if (!chat.members || chat.members.length === 0) return chat;

          const updatedUsers = chat.members.map((u, index) =>
            index === 0 ? { ...u, is_contact: true } : u,
          );

          return {
            ...chat,
            members: updatedUsers,
          };
        }),
      );
    },
    [selectedChatId],
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

      if (!websocketManager.isConnected()) {
        setError('Not connected');
        setLoading(false);
        return;
      }

      const timeoutId = window.setTimeout(() => {
        setLoading(false);
      }, 15000);

      const handleChats = (data: { chats?: unknown[] }) => {
        window.clearTimeout(timeoutId);
        setChats(Array.isArray(data.chats) ? (data.chats as Chat[]) : []);
        setLoading(false);
        const hashRoomId = location.hash
          ? Number(location.hash.substring(1))
          : null;
        if (hashRoomId) {
          setSelectedChatId(hashRoomId);
          fetchChat(hashRoomId);
        }
        websocketManager.off('chats', handleChats);
        websocketManager.off('message', handleError);
      };

      const handleError = (msg: { type?: string; message?: string }) => {
        if (msg.type === 'error') {
          window.clearTimeout(timeoutId);
          setError(msg.message ?? 'Unknown error');
          setLoading(false);
          websocketManager.off('chats', handleChats);
          websocketManager.off('message', handleError);
        }
      };

      websocketManager.on('chats', handleChats);
      websocketManager.on('message', handleError);
      websocketManager.sendMessage({ type: 'get_chats' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [fetchChat]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedChatId(null);
        setActiveProfileTab(null);
        location.hash = '';
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setActiveProfileTab]);

  const handleCreateTemporaryChat = useCallback(
    (user: User) => {
      const tempId = Math.min(...chats.map((c) => c.id), 0) - 1;
      const tempChat: Chat = {
        id: tempId,
        info: null,
        name: user.username,
        media: [],
        members: [user],
        last_message: null,
        unread_count: 0,
        type: 'D',
        primary_media: user.profile.primary_media,
      };

      setChats((prev) => [tempChat, ...prev]);

      selectChat(tempId);
    },
    [chats, selectChat],
  );

  const [, startTransition] = useTransition();

  const handleChatClick = useCallback(
    (chatId: number) => {
      if (chatId === selectedChatId) return;
      startTransition(() => {
        setSelectedChatId(chatId);
        fetchChat(chatId);
      });
    },
    [selectedChatId, fetchChat],
  );

  const value: ChatContextType = useMemo(
    () => ({
      selectedChat,
      messages,
      chats,
      loading,
      error,
      messagesCache,
      editingMessage,
      setEditingMessage,
      selectChat,
      updateMessages,
      updateMessageInChat,
      setChats,
      setLoading,
      getCachedMessages,
      updateChatLastMessage,
      updateChatUnreadCount,
      fetchChats,
      fetchChat,
      handleChatClick,
      handleCreateTemporaryChat,
      setSelectedChatId,
      addContact,
      deleteContact,
      saveContact,
      handleNewMessage,
    }),
    [
      selectedChat,
      messages,
      chats,
      loading,
      error,
      messagesCache,
      editingMessage,
      setEditingMessage,
      selectChat,
      updateMessages,
      updateMessageInChat,
      setChats,
      setLoading,
      getCachedMessages,
      updateChatLastMessage,
      updateChatUnreadCount,
      fetchChats,
      fetchChat,
      handleChatClick,
      handleCreateTemporaryChat,
      setSelectedChatId,
      addContact,
      deleteContact,
      saveContact,
      handleNewMessage,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
