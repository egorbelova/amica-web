import React, { useReducer } from 'react';
import type { Message } from '@/types';
import { MessagesContext, messagesReducer, initialState } from './messagesCore';
import type { MessagesContextType } from './messagesCore';

export const MessagesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(messagesReducer, initialState);

  const getRoomMessages = (roomId: number): Message[] => {
    return state.messages[roomId] || [];
  };

  const addMessage = (roomId: number, message: Message) => {
    dispatch({ type: 'ADD_MESSAGE', payload: { roomId, message } });
  };

  const updateMessage = (
    roomId: number,
    messageId: number,
    updates: Partial<Message>,
  ) => {
    dispatch({
      type: 'UPDATE_MESSAGE',
      payload: { roomId, messageId, updates },
    });
  };

  const deleteMessage = (roomId: number, messageId: number) => {
    dispatch({ type: 'DELETE_MESSAGE', payload: { roomId, messageId } });
  };

  const likeMessage = (roomId: number, messageId: number) => {
    dispatch({ type: 'LIKE_MESSAGE', payload: { roomId, messageId } });
  };

  const loadMessages = (roomId: number, messages: Message[]) => {
    dispatch({ type: 'LOAD_MESSAGES', payload: { roomId, messages } });
  };

  const value: MessagesContextType = {
    state,
    dispatch,
    getRoomMessages,
    addMessage,
    updateMessage,
    deleteMessage,
    likeMessage,
    loadMessages,
  };

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
};
