import { useRef, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { JumpContext } from './jumpShared';
import type { JumpContextValue } from './jumpShared';

export function JumpProvider({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const jumpToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, []);

  const value: JumpContextValue = useMemo(
    () => ({
      containerRef,
      isVisible,
      jumpToBottom,
      setIsVisible,
    }),
    [isVisible, jumpToBottom],
  );

  return <JumpContext.Provider value={value}>{children}</JumpContext.Provider>;
}

JumpProvider.displayName = 'JumpProvider';
