import { createContext } from 'react';

export interface AuthContextType {
  loggedIn: boolean;
  setLoggedIn: (value: boolean) => void;
}

export const AuthContext = createContext<AuthContextType>({
  loggedIn: true,
  setLoggedIn: () => {},
});
