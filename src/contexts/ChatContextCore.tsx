import { createContext, useContext } from 'react';
import type { Message, Chat, User } from '@/types';
import type { WebSocketMessage } from '@/utils/websocket-manager';

export interface ChatContextType {
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
  fetchChat: (chatId: number) => Promise<void>;
  handleChatClick: (chatId: number) => Promise<void>;
  handleCreateTemporaryChat: (user: User) => void;
  setSelectedChatId: (chatId: number | null) => void;
  addContact: (userId: number) => void;
  deleteContact: (contactId: number) => void;
  saveContact: (contactId: number, name: string) => void;
  handleNewMessage: (data: WebSocketMessage) => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

