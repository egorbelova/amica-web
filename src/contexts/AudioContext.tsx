import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { apiFetch } from '@/utils/apiFetch';
import type { File } from '@/types';

const SPEEDS = [0.5, 1, 1.5, 2];

interface AudioContextType {
  currentChatId: number | null;
  coverUrl: string | null;
  playlist: File[] | null;
  setPlaylist: (playlist: File[] | null, currentChatId: number | null) => void;
  togglePlay: (currentAudioId: number) => void;
  isPlaying: boolean;
  currentAudioId: number | null;
  setCurrentAudioId: (currentAudioId: number | null) => void;
  setCoverUrl: (coverUrl: string | null) => void;
  setCurrentTime: (currentTime: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentAudioId, setCurrentAudioId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [playlist, setPlaylistState] = useState<File[] | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const setPlaylist = useCallback(
    (newPlaylist: File[] | null, chatId: number | null) => {
      setCurrentChatId(chatId);

      if (currentChatId !== chatId) {
        setPlaylistState(newPlaylist);
      }
    },
    [currentChatId],
  );

  async function fetchPrivateMedia(url: string) {
    const res = await apiFetch(url);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }

  const togglePlay = useCallback(
    async (audioId: number) => {
      const audio = audioRef.current;
      if (!audio || !playlist) return;

      const file = playlist.find((f) => f.id === audioId);
      if (!file) return;

      if (currentAudioId !== audioId) {
        setCurrentAudioId(audioId);
        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: file.original_name,
            artwork: coverUrl
              ? [
                  {
                    src: coverUrl,
                    sizes: '512x512',
                    type: 'image/png',
                  },
                ]
              : [],
          });
        }

        const url = await fetchPrivateMedia(file.file_url);
        if (audio.src !== url) audio.src = url;

        await audio.play();
        setIsPlaying(true);
        return;
      }

      if (audio.paused) {
        await audio.play();
        setIsPlaying(true);
      } else {
        audio.pause();
        setIsPlaying(false);
      }
    },
    [playlist, currentAudioId],
  );

  useEffect(() => {
    console.log('currentTime', currentTime);

    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = currentTime;
  }, [currentTime]);

  useEffect(() => {
    if (!currentAudioId) audioRef.current?.pause();
  }, [currentAudioId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  return (
    <AudioContext.Provider
      value={{
        coverUrl,
        playlist,
        setPlaylist,
        currentChatId,
        togglePlay,
        isPlaying,
        currentAudioId,
        setCurrentAudioId,
        setCoverUrl,
        setCurrentTime,
      }}
    >
      <audio ref={audioRef} preload='metadata' />
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context)
    throw new Error('useAudio must be used within an AudioProvider');
  return context;
};
