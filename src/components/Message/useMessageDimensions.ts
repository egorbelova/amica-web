import { useState, useLayoutEffect, type RefObject } from 'react';

export function useMessageDimensions(
  elementRef: RefObject<HTMLDivElement | null>,
): { width: number | null; height: number | null } {
  const [dimensions, setDimensions] = useState<{
    width: number | null;
    height: number | null;
  }>({ width: null, height: null });

  useLayoutEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    let rafId: number | null = null;
    const updateSize = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        setDimensions((prev) => {
          const w = el.offsetWidth;
          const h = el.offsetHeight;
          if (prev.width !== w || prev.height !== h) {
            return { width: w, height: h };
          }
          return prev;
        });
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [elementRef]);

  return dimensions;
}
