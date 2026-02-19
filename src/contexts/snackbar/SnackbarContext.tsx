import React, { useState, useCallback } from 'react';
import Snackbar from '@/components/Snackbar/Snackbar';
import { SnackbarContext } from './SnackbarContextCore';
import type { SnackbarType } from './SnackbarContextCore';

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
