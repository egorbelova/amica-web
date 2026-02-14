import React from 'react';
import { UserProvider } from '../contexts/UserContext';
import { MessagesProvider } from '../contexts/MessagesContext';
import { ChatProvider } from '../contexts/ChatContext';
import { AudioProvider } from '../contexts/AudioContext';
import { AuthProvider } from '../contexts/AuthContext';
import { MediaModalProvider } from '../contexts/MediaModalContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { SettingsProvider } from '@/contexts/settings/Settings';
import { SearchProvider } from '@/contexts/search/SearchContext';
import { JumpProvider } from '@/contexts/JumpContext';
import { apiFetch } from '@/utils/apiFetch';
import { SnackbarProvider } from '@/contexts/snackbar/SnackbarContext';
import type { User } from '../types';

interface AppProvidersProps {
  children: React.ReactNode;
}

type ProviderProps = { children: React.ReactNode };

const composeProviders = (
  ...providers: React.ComponentType<ProviderProps>[]
) => {
  return ({ children }: ProviderProps) =>
    providers.reduceRight(
      (acc, Provider) => <Provider>{acc}</Provider>,
      children,
    );
};

export const searchGlobal = async (query: string): Promise<User[]> => {
  const res = await apiFetch(
    `/api/users/search/?email=${encodeURIComponent(query)}`,
  );
  if (!res.ok) throw new Error('Search failed');
  return res.json();
};

const GlobalSearchProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <SearchProvider searchFn={searchGlobal}>{children}</SearchProvider>;

const AppProvidersComponent = composeProviders(
  SnackbarProvider,
  MediaModalProvider,
  AuthProvider,
  SettingsProvider,
  UserProvider,
  GlobalSearchProvider,
  ChatProvider,
  MessagesProvider,
  AudioProvider,
  LanguageProvider,
  JumpProvider,
);

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return <AppProvidersComponent>{children}</AppProvidersComponent>;
};
