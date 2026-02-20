import { createContext } from 'react';

export interface JumpContextValue {
  containerRef: React.RefObject<HTMLDivElement>;
  isVisible: boolean;
  jumpToBottom: () => void;
  setIsVisible: (isVisible: boolean) => void;
}

export const JumpContext = createContext<JumpContextValue | null>(null);
