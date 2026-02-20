import { createContext, useContext } from 'react';

export type SnackbarType = {
  message: string;
} | null;

export type SnackbarContextType = {
  showSnackbar: (message: string, duration?: number) => void;
};

export const SnackbarContext = createContext<SnackbarContextType | null>(null);

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used inside SnackbarProvider');
  }
  return context;
};
