import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from 'react';
import { usePrivateMedia } from '@/hooks/usePrivateMedia';
import styles from './SmartMediaLayout.module.scss';
import { Icon } from '../Icons/AutoIcons';
import { useAudio } from '@/contexts/audioContext';
import { useChat } from '@/contexts/ChatContextCore';

const SPEEDS = [0.5, 1, 1.5, 2];

interface AudioLayoutProps {
  waveform: number[] | null;
  duration: number | null;
  id: number;
  cover_url: string | null;
}

export default function AudioLayout({
  waveform,
  duration,
  id,
  cover_url,
}: AudioLayoutProps) {
  const {
    setPlaylist,
    currentChatId,
    togglePlay: toggleAudio,
    isPlaying: isAudioPlaying,
    currentAudioId,
    setCurrentTime,
  } = useAudio();
  const { selectedChat, messages } = useChat();
  const { objectUrl: cover } = usePrivateMedia(cover_url);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const progressRef = useRef<HTMLDivElement | null>(null);
  const volumeRef = useRef<HTMLDivElement | null>(null);
  const currentTimeRef = useRef(0);
  const [visualTime, setVisualTime] = useState(0);

  const [, setIsPlaying] = useState(false);

  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);

  const [isControlsOpen, setIsControlsOpen] = useState(false);

  const [durationState, setDurationState] = useState(duration ?? 0);

  const safeDuration = durationState || 1;

  const getClientX = (
    e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent,
  ) => ('touches' in e ? e.touches?.[0]?.clientX || 0 : e.clientX || 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let animationFrameId: number | null = null;

    const onPlay = () => {
      setIsPlaying(true);
    };

    const onPause = () => {
      setIsPlaying(false);
    };

    const onEnded = () => setIsPlaying(false);

    const onLoaded = () => setDurationState(audio.duration);

    const animate = () => {
      setVisualTime((prev) => prev + (audio.currentTime - prev) * 0.2);

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('loadedmetadata', onLoaded);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('loadedmetadata', onLoaded);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const coverOpt = cover ?? undefined;
    if (currentChatId !== selectedChat?.id) {
      const newPlaylist = messages.flatMap((message) =>
        (message.files ?? []).filter((file) => file.category === 'audio'),
      );
      setPlaylist(newPlaylist, selectedChat?.id || 0, {
        autoPlayId: id,
        coverUrl: coverOpt,
      });
    } else {
      toggleAudio(id, { coverUrl: coverOpt });
    }
  }, [
    messages,
    selectedChat?.id,
    currentChatId,
    id,
    setPlaylist,
    toggleAudio,
    cover,
  ]);

  const cycleSpeed = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const currentIndex = SPEEDS.indexOf(speed);
    const nextIndex = (currentIndex + 1) % SPEEDS.length;
    const nextSpeed = SPEEDS[nextIndex];

    setSpeed(nextSpeed);
    audio.playbackRate = nextSpeed;
  }, [speed]);

  const startSeek = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();

    const updateTime = (clientX: number) => {
      const rect = progressRef.current!.getBoundingClientRect();
      const percent = (clientX - rect!.left) / rect!.width;
      const clampedPercent = Math.max(0, Math.min(1, percent));
      const time = clampedPercent * durationState;

      audioRef.current!.currentTime = time;
      currentTimeRef.current = time;
      setCurrentTime(time);
    };

    updateTime(getClientX(e));
    const onMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();

      updateTime(getClientX(moveEvent));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onMouseMove as EventListener);
      document.removeEventListener('touchend', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove, { passive: false });
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onMouseMove as EventListener, {
      passive: false,
    });
    document.addEventListener('touchend', onMouseUp);
  };

  // function isVolumeSupported(audio: HTMLAudioElement) {
  //   const initial = audio.volume;

  //   try {
  //     audio.volume = initial === 1 ? 0.5 : 1;
  //     const supported = audio.volume !== initial;
  //     audio.volume = initial;
  //     return supported;
  //   } catch {
  //     return false;
  //   }
  // }

  const [canChangeVolume, setCanChangeVolume] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const checkVolumeSupport = () => {
      if (
        !('volume' in audio) ||
        audio.volume === undefined ||
        audio.volume === null
      ) {
        return false;
      }

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) return false;

      const original = audio.volume;
      audio.volume = 0;
      const canMute = audio.volume === 0;
      audio.volume = original;

      return canMute;
    };

    const supported = checkVolumeSupport();
    setCanChangeVolume(supported);
  }, []);

  const formatTime = (time = 0) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const volumePercent = volume * 100;

  const getVolumeIcon = () => {
    if (volume === 0) return 'SoundMuteFill';
    if (volume < 0.5) return 'SoundMinFill';
    return 'SoundMaxFill';
  };

  const setVolumeByClientX = (clientX: number) => {
    const rect = volumeRef.current?.getBoundingClientRect();
    const percent = (clientX - rect!.left) / rect!.width;
    const value = Math.max(0, Math.min(1, percent));

    audioRef.current!.volume = value;
    setVolume(value);
  };

  const startVolumeDrag = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setVolumeByClientX(getClientX(e));

    const onMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
      setVolumeByClientX(getClientX(moveEvent));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onMouseMove);
      document.removeEventListener('touchend', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onMouseMove);
    document.addEventListener('touchend', onMouseUp);
  };

  const barWidth = 3;
  const gap = 1;
  const totalBars = waveform?.length || 0;

  const [svgWidth, setSvgWidth] = useState(() => totalBars * (barWidth + gap));

  useLayoutEffect(() => {
    const el = progressRef.current;
    const fallback = totalBars * (barWidth + gap);

    const update = () => {
      if (el) setSvgWidth(el.clientWidth);
      else setSvgWidth(fallback);
    };

    update();

    let ro: ResizeObserver | null = null;
    if (el && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update);
      ro.observe(el);
    } else {
      window.addEventListener('resize', update);
    }

    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', update);
    };
  }, [progressRef, totalBars, barWidth, gap]);

  const height = 40;
  const padding = 5;
  const center = (height - 2 * padding) / 2 + padding;

  return (
    <div
      className={styles.player}
      onMouseOver={() => setIsControlsOpen(true)}
      onMouseOut={() => setIsControlsOpen(false)}
    >
      {cover && <img src={cover} alt='' className={styles.cover} />}
      <audio ref={audioRef} preload='none' />

      <button onClick={togglePlay} className={styles.play}>
        {isAudioPlaying && currentAudioId === id ? (
          <Icon name='Pause' />
        ) : (
          <Icon name='Play' />
        )}
      </button>

      <div className={styles.timeline}>
        <div
          ref={progressRef}
          className={styles.progress}
          onMouseDown={startSeek}
          onTouchStart={startSeek}
        >
          {!waveform && (
            <div className={styles.progressFillWrapper}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${(visualTime / safeDuration) * svgWidth}px`,
                }}
              />
            </div>
          )}
          {waveform && (
            <svg width={svgWidth} height={height}>
              <defs>
                <mask
                  id={id.toString()}
                  maskUnits='userSpaceOnUse'
                  x='0'
                  y='0'
                  width={svgWidth}
                  height={height}
                >
                  {waveform.map((value, i) => {
                    const lineHeight = value * (height - 2 * padding);
                    const x = (i / (waveform.length - 1)) * svgWidth;
                    const y = center - lineHeight / 2;
                    return (
                      <rect
                        key={i}
                        x={x}
                        y={y}
                        width={barWidth}
                        height={lineHeight}
                        rx={barWidth / 2}
                        ry={barWidth / 2}
                        fill='white'
                      />
                    );
                  })}
                </mask>
              </defs>

              {waveform.map((value, i) => {
                const lineHeight = value * (height - 2 * padding);
                const x = (i / (waveform.length - 1)) * svgWidth;
                const y = center - lineHeight / 2;
                return (
                  <rect
                    key={i}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={lineHeight}
                    rx={barWidth / 2}
                    ry={barWidth / 2}
                    fill='#c7d2fe'
                  />
                );
              })}

              <rect
                x={0}
                y={0}
                width={(visualTime / safeDuration) * svgWidth}
                height={height}
                fill='#ffffffff'
                mask={`url(#${id})`}
              />
            </svg>
          )}
        </div>
      </div>
      <div className={styles.controlsWrapper}>
        <div className={styles.time}>
          {formatTime(visualTime)} / {formatTime(durationState)}
        </div>
        <div className={`${styles.controls} ${isControlsOpen && styles.open} `}>
          <button className={styles.speed} onClick={cycleSpeed}>
            {speed}×
          </button>

          {canChangeVolume && (
            <div className={styles.volumeWrapper}>
              <button className={styles.volumeButton}>
                <Icon name={getVolumeIcon()} />
              </button>

              <div className={styles.volumePopover}>
                <div
                  ref={volumeRef}
                  className={styles.volume}
                  onMouseDown={startVolumeDrag}
                >
                  <div
                    className={styles.volumeFill}
                    style={{ width: `${volumePercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
