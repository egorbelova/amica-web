import { useLayoutEffect, useRef, type RefObject } from 'react';

/**
 * Measures the container's first child and sets container's width/height style.
 * No state → no extra re-render.
 */
export function useMessageDimensions(
  containerRef: RefObject<HTMLDivElement | null>,
): void {
  const lastRef = useRef({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const content = container.firstElementChild as HTMLElement | null;
    if (!content) return;

    let rafId: number | null = null;
    const updateSize = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const w = content.offsetWidth;
        const h = content.offsetHeight;
        const last = lastRef.current;
        if (last.width !== w || last.height !== h) {
          lastRef.current = { width: w, height: h };
          container.style.width = `${w}px`;
          container.style.height = `${h}px`;
        }
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(content);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [containerRef]);
}
