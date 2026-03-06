import { useRef, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { JumpContext, JumpActionsContext } from './jumpShared';
import type { JumpContextValue, JumpActionsContextValue } from './jumpShared';

export function JumpProvider({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  }, []);

  const jumpToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const actionsValue: JumpActionsContextValue = useMemo(
    () => ({
      containerRef,
      setContainerRef,
      setIsVisible,
      jumpToBottom,
    }),
    [setContainerRef, jumpToBottom],
  );

  const fullValue: JumpContextValue = useMemo(
    () => ({
      ...actionsValue,
      isVisible,
    }),
    [actionsValue, isVisible],
  );

  return (
    <JumpActionsContext.Provider value={actionsValue}>
      <JumpContext.Provider value={fullValue}>{children}</JumpContext.Provider>
    </JumpActionsContext.Provider>
  );
}

JumpProvider.displayName = 'JumpProvider';
