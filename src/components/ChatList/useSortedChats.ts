import { useMemo } from 'react';
import type { Chat } from '@/types';

export function useSortedChats(chats: Chat[]): Chat[] {
  return useMemo(() => {
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
}
