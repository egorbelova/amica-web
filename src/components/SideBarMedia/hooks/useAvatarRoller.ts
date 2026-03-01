import { useState, useCallback, useEffect, startTransition } from 'react';

export function useAvatarRoller(
  chatId: string,
  mediaCount: number,
  hasPrimaryMedia: boolean,
  sidebarRef: React.RefObject<HTMLDivElement | null>,
  interlocutorEditVisible: boolean,
) {
  const [isOpen, setIsOpen] = useState(false);
  const [rollPosition, setRollPosition] = useState(0);

  const setOpen = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      if (!chatId) return;
      setIsOpen((prev) => (typeof value === 'function' ? value(prev) : value));
    },
    [chatId],
  );

  const setPosition = useCallback(
    (value: number | ((prev: number) => number)) => {
      if (!chatId) return;
      setRollPosition((prev) =>
        typeof value === 'function' ? value(prev) : value,
      );
    },
    [chatId],
  );

  useEffect(() => {
    if (!chatId) return;
    startTransition(() => {
      setIsOpen(false);
      setRollPosition(0);
    });
  }, [chatId]);

  const handleRollPositionChange = useCallback(() => {
    if (interlocutorEditVisible || !isOpen || !mediaCount) return;
    setRollPosition((prev) => (prev === mediaCount ? 0 : prev + 1));
  }, [interlocutorEditVisible, isOpen, mediaCount]);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar || interlocutorEditVisible || !hasPrimaryMedia) return;

    let touchStartY = 0;
    let isTrackingTouch = false;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;
      if (e.deltaY > 0 && isOpen) {
        setOpen(false);
        setPosition(0);
      }
      if (e.deltaY < 0 && sidebar.scrollTop === 0 && !isOpen) {
        setOpen(true);
        setPosition(0);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      isTrackingTouch = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTrackingTouch) return;
      const currentY = e.touches[0].clientY;
      const deltaY = touchStartY - currentY;
      if (deltaY > 30 && isOpen) {
        setOpen(false);
        setPosition(0);
        isTrackingTouch = false;
      }
      if (deltaY < -30 && sidebar.scrollTop === 0 && !isOpen) {
        setOpen(true);
        setPosition(0);
        isTrackingTouch = false;
      }
    };

    const handleTouchEnd = () => {
      isTrackingTouch = false;
    };

    sidebar.addEventListener('wheel', handleWheel, { passive: true });
    sidebar.addEventListener('touchstart', handleTouchStart, { passive: true });
    sidebar.addEventListener('touchmove', handleTouchMove, { passive: false });
    sidebar.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      sidebar.removeEventListener('wheel', handleWheel);
      sidebar.removeEventListener('touchstart', handleTouchStart);
      sidebar.removeEventListener('touchmove', handleTouchMove);
      sidebar.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    isOpen,
    setOpen,
    setPosition,
    sidebarRef,
    hasPrimaryMedia,
    interlocutorEditVisible,
  ]);

  const effectiveRollPosition = interlocutorEditVisible ? 0 : rollPosition;

  return {
    isAvatarRollerOpen: isOpen,
    setIsAvatarRollerOpen: setOpen,
    rollPosition,
    setRollPosition: setPosition,
    effectiveRollPosition,
    handleRollPositionChange,
  };
}
