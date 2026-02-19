import { createContext, useContext, useRef, useState, useEffect } from 'react';

const JumpContext = createContext<JumpContextValue | null>(null);

interface JumpContextValue {
  containerRef: React.RefObject<HTMLDivElement>;
  isVisible: boolean;
  jumpToBottom: () => void;
  setIsVisible: (isVisible: boolean) => void;
}

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

export const useJump = () => {
  const context = useContext(JumpContext);
  if (!context) throw new Error('useJump must be used inside JumpProvider');
  return context;
};
