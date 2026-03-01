import { useState, useEffect } from 'react';

const MIN_COLUMNS = 1;
const MAX_COLUMNS = 20;

export function useGridPinchZoom(
  gridRef: React.RefObject<HTMLDivElement | null>,
  sidebarInnerRef: React.RefObject<HTMLDivElement | null>,
) {
  const [rowScale, setRowScale] = useState(3);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const pointers = new Map<number, PointerEvent>();
    const initialPositions = new Map<number, { x: number; y: number }>();
    let initialColumns = rowScale;

    const handlePointerDown = (e: PointerEvent) => {
      pointers.set(e.pointerId, e);
      initialPositions.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) initialColumns = rowScale;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (pointers.size !== 2) return;
      pointers.set(e.pointerId, e);
      const [p1, p2] = Array.from(pointers.values());
      const pos1 = initialPositions.get(p1.pointerId)!;
      const pos2 = initialPositions.get(p2.pointerId)!;
      const averageDeltaX = (p1.clientX - pos1.x + (p2.clientX - pos2.x)) / 2;
      if (Math.abs(averageDeltaX) < 1) return;

      const container = gridRef.current!;
      const containerRect = container.getBoundingClientRect();
      const cursorXInContainerBefore =
        e.clientX - containerRect.left + container.scrollLeft;

      let newColumns = Math.round(initialColumns + averageDeltaX);
      newColumns = Math.max(MIN_COLUMNS, Math.min(MAX_COLUMNS, newColumns));
      if (newColumns === rowScale) return;

      setRowScale(newColumns);
      requestAnimationFrame(() => {
        const ratio = newColumns / rowScale;
        const cursorXInContainerAfter = cursorXInContainerBefore * ratio;
        container.scrollLeft =
          cursorXInContainerAfter - (e.clientX - containerRect.left);
      });
    };

    const handlePointerUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      initialPositions.delete(e.pointerId);
      if (pointers.size < 2) initialColumns = rowScale;
    };

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      if (Math.abs(e.deltaY) < 1) return;

      const container = sidebarInnerRef.current!;
      const containerRect = container.getBoundingClientRect();
      const cursorXInContainerBefore =
        e.clientX - containerRect.left + container.scrollLeft;
      const deltaColumns = e.deltaY / 10;
      let newColumns = Math.round(rowScale + deltaColumns);
      newColumns = Math.max(MIN_COLUMNS, Math.min(MAX_COLUMNS, newColumns));
      if (newColumns === rowScale) return;

      setRowScale(newColumns);
      requestAnimationFrame(() => {
        const ratio = newColumns / rowScale;
        const cursorXInContainerAfter = cursorXInContainerBefore * ratio;
        container.scrollLeft =
          cursorXInContainerAfter - (e.clientX - containerRect.left);
      });
    };

    const handleWheelEnd = () => {
      initialColumns = rowScale;
    };

    grid.addEventListener('pointerdown', handlePointerDown);
    grid.addEventListener('pointermove', handlePointerMove);
    grid.addEventListener('pointerup', handlePointerUp);
    grid.addEventListener('pointercancel', handlePointerUp);
    grid.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keyup', handleWheelEnd);
    window.addEventListener('mouseup', handleWheelEnd);

    return () => {
      grid.removeEventListener('pointerdown', handlePointerDown);
      grid.removeEventListener('pointermove', handlePointerMove);
      grid.removeEventListener('pointerup', handlePointerUp);
      grid.removeEventListener('pointercancel', handlePointerUp);
      grid.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keyup', handleWheelEnd);
      window.removeEventListener('mouseup', handleWheelEnd);
    };
  }, [gridRef, sidebarInnerRef, rowScale]);

  return rowScale;
}
