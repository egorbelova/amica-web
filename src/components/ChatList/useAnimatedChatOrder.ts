import {
  useState,
  useRef,
  useCallback,
  useLayoutEffect,
  startTransition,
} from 'react';
import type { Chat } from '@/types';

export function useAnimatedChatOrder(sortedChats: Chat[]) {
  const [animatedChats, setAnimatedChats] = useState<Chat[]>([]);
  const prevChatIdsRef = useRef<number[]>([]);
  const chatItemsRef = useRef<Map<number, HTMLAnchorElement>>(new Map());

  const setChatItemRef = useCallback(
    (chatId: number, element: HTMLAnchorElement | null) => {
      if (element) chatItemsRef.current.set(chatId, element);
      else chatItemsRef.current.delete(chatId);
    },
    [],
  );

  useLayoutEffect(() => {
    if (!sortedChats.length) {
      startTransition(() => {
        setAnimatedChats((prev) => (prev.length === 0 ? prev : []));
        prevChatIdsRef.current = [];
      });
      return;
    }

    const currentChatIds = sortedChats.map((c) => c.id);
    const prevChatIds = prevChatIdsRef.current;

    const setIfChanged = (next: Chat[]) => {
      setAnimatedChats((prev) => {
        if (
          prev.length === next.length &&
          prev.every((c, i) => c.id === next[i].id)
        ) {
          return prev;
        }
        return next;
      });
    };

    if (prevChatIds.length === 0) {
      prevChatIdsRef.current = currentChatIds;
      return;
    }

    const orderChanged =
      prevChatIds.length !== currentChatIds.length ||
      prevChatIds.some((id, i) => id !== currentChatIds[i]);

    if (!orderChanged) {
      requestAnimationFrame(() => setIfChanged(sortedChats));
      return;
    }

    const prevPositions = new Map<number, DOMRect>();
    chatItemsRef.current.forEach((el, id) => {
      prevPositions.set(id, el.getBoundingClientRect());
    });

    requestAnimationFrame(() => {
      setIfChanged(sortedChats);
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

  const displayChats = animatedChats.length > 0 ? animatedChats : sortedChats;

  return { displayChats, setChatItemRef };
}
