import { useRef, useState } from 'react';
import { JumpContext } from './jumpShared';
import type { JumpContextValue } from './jumpShared';

export function JumpProvider({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const jumpToBottom = () => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  return (
    <JumpContext.Provider
      value={
        {
          containerRef,
          isVisible,
          jumpToBottom,
          setIsVisible,
        } as JumpContextValue
      }
    >
      {children}
    </JumpContext.Provider>
  );
}
