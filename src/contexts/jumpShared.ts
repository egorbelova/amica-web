import { createContext } from 'react';

/** Stable ref/setters – use in MessageList to avoid re-renders when isVisible toggles */
export interface JumpActionsContextValue {
  containerRef: React.RefObject<HTMLDivElement>;
  setContainerRef: (node: HTMLDivElement | null) => void;
  setIsVisible: (isVisible: boolean) => void;
  jumpToBottom: () => void;
}

export interface JumpContextValue extends JumpActionsContextValue {
  isVisible: boolean;
}

export const JumpActionsContext =
  createContext<JumpActionsContextValue | null>(null);
export const JumpContext = createContext<JumpContextValue | null>(null);
