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
  const chatItemsRef = useRef<Map<number, HTMLDivElement>>(new Map());

  const setChatItemRef = useCallback(
    (chatId: number, element: HTMLDivElement | null) => {
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
      setAnimatedChats(next);
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
            el.animate(
              [
                { transform: `translate(${dx}px, ${dy}px)` },
                { transform: 'translate(0, 0)' },
              ],
              {
                duration: 300,
                easing: 'ease',
              },
            );
          }
        });
      });
    });
  }, [sortedChats]);

  const displayChats = animatedChats.length > 0 ? animatedChats : sortedChats;

  return { displayChats, setChatItemRef };
}
