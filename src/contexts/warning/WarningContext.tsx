import React, { useState, useCallback, useMemo } from 'react';
import Warning from '@/components/Warning/Warning';
import { WarningContext } from './WarningContextCore';
import type { WarningPayload } from './WarningContextCore';

export const WarningProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [warning, setWarning] = useState<WarningPayload | null>(null);

  const dismissWarning = useCallback(() => {
    setWarning(null);
  }, []);

  const showWarning = useCallback((payload: WarningPayload) => {
    setWarning(payload);
  }, []);

  const value = useMemo(
    () => ({ showWarning, dismissWarning }),
    [showWarning, dismissWarning],
  );

  return (
    <WarningContext.Provider value={value}>
      {children}
      {warning ? (
        <Warning
          title={warning.title}
          body={warning.body}
          dismissLabel={warning.dismissLabel}
          confirmLabel={warning.confirmLabel}
          onConfirm={warning.onConfirm}
          onDismissAction={warning.onDismissAction}
          onDismiss={dismissWarning}
        />
      ) : null}
    </WarningContext.Provider>
  );
};
