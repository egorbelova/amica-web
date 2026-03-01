import { useEffect } from 'react';
import type { SideBarTab } from './useSideBarMediaData';

export function useTabSwipe(
  gridRef: React.RefObject<HTMLDivElement | null>,
  activeTab: SideBarTab | null,
  availableTabs: SideBarTab[],
  setActiveTab: (tab: SideBarTab) => void,
) {
  useEffect(() => {
    const sidebar = gridRef.current;
    if (!sidebar) return;

    let pointerStartX = 0;
    let isSwiping = false;

    const handlePointerDown = (e: PointerEvent) => {
      pointerStartX = e.clientX;
      isSwiping = true;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isSwiping) return;
      const deltaX = e.clientX - pointerStartX;
      if (Math.abs(deltaX) > 50) {
        const currentIndex = availableTabs.indexOf(activeTab!);
        if (deltaX < 0) {
          const nextIndex = Math.min(
            currentIndex + 1,
            availableTabs.length - 1,
          );
          setActiveTab(availableTabs[nextIndex]);
        } else {
          const prevIndex = Math.max(currentIndex - 1, 0);
          setActiveTab(availableTabs[prevIndex]);
        }
      }
      isSwiping = false;
    };

    sidebar.addEventListener('pointerdown', handlePointerDown);
    sidebar.addEventListener('pointerup', handlePointerUp);
    sidebar.addEventListener('pointercancel', handlePointerUp);

    return () => {
      sidebar.removeEventListener('pointerdown', handlePointerDown);
      sidebar.removeEventListener('pointerup', handlePointerUp);
      sidebar.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [gridRef, activeTab, availableTabs, setActiveTab]);
}
