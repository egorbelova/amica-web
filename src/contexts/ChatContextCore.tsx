import { createContext, useContext } from 'react';
import type { Message, Chat, User } from '@/types';
import type { WebSocketMessage } from '@/utils/websocket-manager';

/** Context for chat list, selection, loading – use when you don't need messages */
export interface ChatMetaContextType {
  selectedChat: Chat | null;
  chats: Chat[];
  loading: boolean;
  error: string | null;
  fetchChats: () => Promise<void>;
  fetchChat: (chatId: number) => Promise<void>;
  handleChatClick: (chatId: number) => void;
  handleCreateTemporaryChat: (user: User) => void;
  setSelectedChatId: (chatId: number | null) => void;
  addContact: (userId: number) => void;
  deleteContact: (contactId: number) => void;
  saveContact: (contactId: number, name: string) => void;
  setChats: (chats: Chat[]) => void;
  setLoading: (loading: boolean) => void;
}

/** Context for messages and message actions – use in message list, input, etc. */
export interface ChatMessagesContextType {
  messages: Message[];
  messagesCache: { [roomId: number]: Message[] };
  editingMessage: Message | null;
  setEditingMessage: (message: Message | null) => void;
  updateMessages: (messages: Message[], chatId: number) => void;
  updateMessageInChat: (
    chatId: number,
    messageId: number,
    updates: Partial<Message>,
  ) => void;
  removeMessageFromChat: (chatId: number, messageId: number) => void;
  getCachedMessages: (roomId: number) => Message[] | null;
  updateChatLastMessage: (chatId: number, lastMessage: Message | null) => void;
  updateChatUnreadCount: (chatId: number, unreadCount: number) => void;
  handleNewMessage: (data: WebSocketMessage) => void;
}

export type ChatContextType = ChatMetaContextType & ChatMessagesContextType;

export const ChatMetaContext = createContext<ChatMetaContextType | undefined>(
  undefined,
);

export const ChatMessagesContext = createContext<
  ChatMessagesContextType | undefined
>(undefined);

/** Use when component only needs chat list / selection / loading. Avoids re-renders on message updates. */
export const useChatMeta = (): ChatMetaContextType => {
  const context = useContext(ChatMetaContext);
  if (context === undefined) {
    throw new Error('useChatMeta must be used within a ChatProvider');
  }
  return context;
};

/** Use when component only needs messages and message actions. Avoids re-renders on chat list/selection changes. */
export const useChatMessages = (): ChatMessagesContextType => {
  const context = useContext(ChatMessagesContext);
  if (context === undefined) {
    throw new Error('useChatMessages must be used within a ChatProvider');
  }
  return context;
};

/** Use when component needs both meta and messages. Re-renders on any chat or message change. */
export const useChat = (): ChatContextType => {
  const meta = useContext(ChatMetaContext);
  const messages = useContext(ChatMessagesContext);
  if (meta === undefined || messages === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return { ...meta, ...messages };
};
