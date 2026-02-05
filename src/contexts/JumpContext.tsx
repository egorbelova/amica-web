import { createContext, useContext, useRef, useState, useEffect } from 'react';

const JumpContext = createContext(null);

export function JumpProvider({ children }) {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const jumpToBottom = () => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  return (
    <JumpContext.Provider
      value={{ containerRef, isVisible, jumpToBottom, setIsVisible }}
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
