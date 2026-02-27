import React, { useState, useCallback, useRef, useMemo } from 'react';
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
  const [showKey, setShowKey] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSnackbar = useCallback((message: string, duration = 2000) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShowKey((k) => k + 1);
    setSnackbar({ message });
    setOpen(true);

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      setOpen(false);
    }, duration);
  }, []);

  const handleExited = () => {
    setSnackbar(null);
  };

  const value = useMemo(
    () => ({ showSnackbar }),
    [showSnackbar],
  );

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      {snackbar && (
        <Snackbar
          key={showKey}
          message={snackbar.message}
          open={open}
          onExited={handleExited}
        />
      )}
    </SnackbarContext.Provider>
  );
};
