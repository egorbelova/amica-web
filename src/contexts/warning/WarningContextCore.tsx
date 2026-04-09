import { createContext, useContext, type ReactNode } from 'react';

export type WarningPayload = {
  title: string;
  body?: ReactNode;
  dismissLabel?: string;
  /** Optional second action for critical confirmations (e.g. destructive OK). */
  confirmLabel?: string;
  onConfirm?: () => void;
  /** Runs when the user closes via the dismiss button (not via confirm). */
  onDismissAction?: () => void;
};

export type WarningContextType = {
  showWarning: (payload: WarningPayload) => void;
  dismissWarning: () => void;
};

export const WarningContext = createContext<WarningContextType | null>(null);

export const useWarning = () => {
  const context = useContext(WarningContext);
  if (!context) {
    throw new Error('useWarning must be used inside WarningProvider');
  }
  return context;
};
