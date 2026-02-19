import React, { createContext, useContext, useState, useCallback } from 'react';
import Snackbar from '@/components/Snackbar/Snackbar';

const SnackbarContext = createContext<SnackbarContextType | null>(null);

type SnackbarType = {
  message: string;
} | null;

type SnackbarContextType = {
  showSnackbar: (message: string, duration?: number) => void;
};

export const SnackbarProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [snackbar, setSnackbar] = useState<SnackbarType>(null);
  const [open, setOpen] = useState(false);

  const showSnackbar = useCallback((message: string, duration = 2000) => {
    setSnackbar({ message });
    setOpen(true);

    setTimeout(() => {
      setOpen(false);
    }, duration);
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  const handleExited = () => {
    setSnackbar(null);
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {snackbar && (
        <Snackbar
          message={snackbar.message}
          open={open}
          onExited={handleExited}
        />
      )}
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used inside SnackbarProvider');
  }
  return context;
};
