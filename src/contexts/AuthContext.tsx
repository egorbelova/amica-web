import React, { useState, useMemo } from 'react';
import { AuthContext } from './AuthContextCore';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loggedIn, setLoggedIn] = useState(true);

  const value = useMemo(
    () => ({ loggedIn, setLoggedIn }),
    [loggedIn],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
