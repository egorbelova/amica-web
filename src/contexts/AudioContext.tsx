import React, { useRef, useState, useCallback, useEffect } from 'react';
import { fetchPrivateMedia } from '@/utils/audio';
import type { File } from '@/types';
import { AudioContext } from '@/contexts/audioContext';

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
    (
      newPlaylist: File[] | null,
      chatId: number | null,
      opts?: { autoPlayId?: number | null },
    ) => {
      setCurrentChatId(chatId);

      if (currentChatId !== chatId) {
        setPlaylistState(newPlaylist);
      } else {
        // still update playlist to the new one even if the chat is same
        setPlaylistState(newPlaylist);
      }

      // If caller requested autoplay, handle it here using the provided playlist
      if (opts?.autoPlayId != null && newPlaylist) {
        void (async () => {
          const audio = audioRef.current;
          if (!audio) return;

          const audioId = opts.autoPlayId!;
          const file = newPlaylist.find((f) => f.id === audioId);
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
        })();
      }
    },
    [currentChatId, currentAudioId, coverUrl],
  );

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
    [playlist, currentAudioId, coverUrl],
  );

  useEffect(() => {
    // console.log('currentTime', currentTime);

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

export default AudioProvider;
