import React, { useRef, useState, useCallback, useEffect } from 'react';
import { fetchPrivateMedia } from '@/utils/audio';
import type { File } from '@/types';
import { AudioContext } from '@/contexts/audioContext';

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const coverBlobUrlRef = useRef<string | null>(null);
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
      opts?: { autoPlayId?: number | null; coverUrl?: string | null },
    ) => {
      setCurrentChatId(chatId);

      if (currentChatId !== chatId) {
        setPlaylistState(newPlaylist);
      } else {
        setPlaylistState(newPlaylist);
      }

      const cover = opts?.coverUrl ?? null;
      if (cover !== null) {
        coverBlobUrlRef.current = null;
        setCoverUrl(cover);
      }

      if (opts?.autoPlayId != null && newPlaylist) {
        void (async () => {
          const audio = audioRef.current;
          if (!audio) return;

          const audioId = opts.autoPlayId!;
          const file = newPlaylist.find((f) => f.id === audioId);
          if (!file) return;

          if (currentAudioId !== audioId) {
            setCurrentAudioId(audioId);
            const artworkUrl = cover ?? null;
            if ('mediaSession' in navigator) {
              navigator.mediaSession.metadata = new MediaMetadata({
                title: file.original_name ?? '',
                artwork: artworkUrl
                  ? [
                      {
                        src: artworkUrl,
                        sizes: '512x512',
                        type: 'image/png',
                      },
                    ]
                  : [],
              });
            }

            const url = await fetchPrivateMedia(file.file_url!);
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
    [currentChatId, currentAudioId],
  );

  const togglePlay = useCallback(
    async (audioId: number, opts?: { coverUrl?: string | null }) => {
      const audio = audioRef.current;
      if (!audio || !playlist) return;

      const file = playlist.find((f) => f.id === audioId);
      if (!file) return;

      const cover = opts?.coverUrl ?? null;
      if (cover !== null) {
        coverBlobUrlRef.current = null;
        setCoverUrl(cover);
      }

      if (currentAudioId !== audioId) {
        setCurrentAudioId(audioId);
        const artworkUrl = cover !== null ? cover : coverUrl;
        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: file.original_name ?? '',
            artwork: artworkUrl
              ? [
                  {
                    src: artworkUrl,
                    sizes: '512x512',
                    type: 'image/png',
                  },
                ]
              : [],
          });
        }

        const url = await fetchPrivateMedia(file.file_url!);
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

  const playPrev = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !playlist || currentAudioId == null) return;

    const index = playlist.findIndex((f) => f.id === currentAudioId);
    if (index <= 0) {
      audio.currentTime = 0;
      if (audio.paused) await audio.play();
      setIsPlaying(true);
      return;
    }

    const file = playlist[index - 1];
    const cover =
      file.cover_url != null ? await fetchPrivateMedia(file.cover_url) : null;
    if (coverBlobUrlRef.current) {
      URL.revokeObjectURL(coverBlobUrlRef.current);
    }
    coverBlobUrlRef.current = cover;
    setCoverUrl(cover);
    setCurrentAudioId(file.id ?? null);
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: file.original_name ?? '',
        artwork: cover
          ? [{ src: cover, sizes: '512x512', type: 'image/png' }]
          : [],
      });
    }
    const url = await fetchPrivateMedia(file.file_url!);
    if (audio.src !== url) audio.src = url;
    await audio.play();
    setIsPlaying(true);
  }, [playlist, currentAudioId]);

  const playNext = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !playlist || currentAudioId == null) return;

    const index = playlist.findIndex((f) => f.id === currentAudioId);
    if (index < 0 || index >= playlist.length - 1) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    const file = playlist[index + 1];
    const cover =
      file.cover_url != null ? await fetchPrivateMedia(file.cover_url) : null;
    if (coverBlobUrlRef.current) {
      URL.revokeObjectURL(coverBlobUrlRef.current);
    }
    coverBlobUrlRef.current = cover;
    setCoverUrl(cover);
    setCurrentAudioId(file.id ?? null);
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: file.original_name ?? '',
        artwork: cover
          ? [{ src: cover, sizes: '512x512', type: 'image/png' }]
          : [],
      });
    }
    const url = await fetchPrivateMedia(file.file_url!);
    if (audio.src !== url) audio.src = url;
    await audio.play();
    setIsPlaying(true);
  }, [playlist, currentAudioId]);

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

    const onPlay = () => {
      setIsPlaying(true);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
    };
    const onPause = () => {
      setIsPlaying(false);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    };
    const onEnded = () => setIsPlaying(false);

    const onPlaying = () => {
      if (!('mediaSession' in navigator)) return;
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        void playPrev();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        void playNext();
      });
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('playing', onPlaying);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('playing', onPlaying);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
      }
    };
  }, [playPrev, playNext]);

  return (
    <AudioContext.Provider
      value={{
        coverUrl,
        playlist,
        setPlaylist,
        currentChatId,
        togglePlay,
        playPrev,
        playNext,
        isPlaying,
        currentAudioId,
        setCurrentAudioId,
        setCoverUrl,
        setCurrentTime,
        audioRef,
      }}
    >
      <audio ref={audioRef} preload='metadata' />
      {children}
    </AudioContext.Provider>
  );
};

export default AudioProvider;
