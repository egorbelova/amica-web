import React, { createContext, useContext, useState, useCallback } from 'react';
import Snackbar from '@/components/Snackbar/Snackbar';

const SnackbarContext = createContext(null);

export const SnackbarProvider = ({ children }) => {
  const [snackbar, setSnackbar] = useState(null);
  const [open, setOpen] = useState(false);

  const showSnackbar = useCallback((message, duration = 2000) => {
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
