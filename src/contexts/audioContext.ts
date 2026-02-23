import { createContext, useContext } from 'react';
import type { File } from '@/types';

export interface AudioContextType {
  currentChatId: number | null;
  coverUrl: string | null;
  playlist: File[] | null;
  setPlaylist: (
    playlist: File[] | null,
    currentChatId: number | null,
    opts?: { autoPlayId?: number | null; coverUrl?: string | null },
  ) => void;
  togglePlay: (audioId: number, opts?: { coverUrl?: string | null }) => void;
  playPrev: () => void;
  playNext: () => void;
  isPlaying: boolean;
  currentAudioId: number | null;
  setCurrentAudioId: (currentAudioId: number | null) => void;
  setCoverUrl: (coverUrl: string | null) => void;
  setCurrentTime: (currentTime: number) => void;
  audioRef: React.RefObject<HTMLAudioElement> | null;
}

export const AudioContext = createContext<AudioContextType | undefined>(
  undefined,
);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context)
    throw new Error('useAudio must be used within an AudioProvider');
  return context;
};
