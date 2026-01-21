import { useEffect, useRef, useState } from 'react';
import { usePrivateMedia } from '@/hooks/usePrivateMedia';
import styles from './SmartMediaLayout.module.scss';
import { Icon } from '../Icons/AutoIcons';

const SPEEDS = [0.5, 1, 1.5, 2];

export default function AudioLayout({ full, waveform, duration, id }) {
  const { objectUrl } = usePrivateMedia(full);
  const audioRef = useRef(null);

  const progressRef = useRef(null);
  const volumeRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);

  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const volumeWrapperRef = useRef(null);

  const [durationState, setDurationState] = useState(duration ?? 0);

  const [visualTime, setVisualTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let animationFrameId;

    const animate = () => {
      setVisualTime((prev) => prev + (audio.currentTime - prev) * 0.2);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [audioRef.current, objectUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => setDurationState(audio.duration);
    audio.addEventListener('loadedmetadata', onLoaded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
    };
  }, [objectUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let animationFrameId;

    const update = () => {
      setCurrentTime(audio.currentTime);
      animationFrameId = requestAnimationFrame(update);
    };

    const start = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(update);
    };

    const onPlay = () => start();
    const onPause = () => cancelAnimationFrame(animationFrameId);
    const onSeeked = () => start();

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('seeked', onSeeked);

    if (!audio.paused) start();

    return () => {
      cancelAnimationFrame(animationFrameId);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('seeked', onSeeked);
    };
  }, [objectUrl, audioRef.current]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = speed;
  }, [speed]);

  if (!objectUrl) return null;

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const seek = (e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = Math.max(0, Math.min(1, percent)) * durationState;

    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const cycleSpeed = () => {
    setSpeed((prev) => {
      const index = SPEEDS.indexOf(prev);
      return SPEEDS[(index + 1) % SPEEDS.length];
    });
  };

  const startSeek = (e) => {
    e.preventDefault();

    const updateTime = (clientX) => {
      const rect = progressRef.current.getBoundingClientRect();
      const percent = (clientX - rect.left) / rect.width;
      const clampedPercent = Math.max(0, Math.min(1, percent));
      const time = clampedPercent * durationState;

      audioRef.current.currentTime = time;
      setCurrentTime(time);
    };

    updateTime(e.clientX);
    const onMouseMove = (moveEvent) => {
      updateTime(moveEvent.clientX);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const formatTime = (time = 0) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const progressPercent = durationState
    ? (currentTime / durationState) * 100
    : 0;
  const volumePercent = volume * 100;

  const getVolumeIcon = () => {
    if (volume === 0) return 'SoundMuteFill';
    if (volume < 0.5) return 'SoundMinFill';
    return 'SoundMaxFill';
  };

  const setVolumeByClientX = (clientX) => {
    const rect = volumeRef.current.getBoundingClientRect();
    const percent = (clientX - rect.left) / rect.width;
    const value = Math.max(0, Math.min(1, percent));

    audioRef.current.volume = value;
    setVolume(value);
  };

  const startVolumeDrag = (e) => {
    e.preventDefault();
    setVolumeByClientX(e.clientX);

    const onMouseMove = (moveEvent) => {
      setVolumeByClientX(moveEvent.clientX);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const barWidth = 3;
  const gap = 1;
  const totalBars = waveform?.length || 0;

  const svgWidth = progressRef.current
    ? progressRef.current.clientWidth
    : totalBars * (barWidth + gap);

  const height = 40;
  const padding = 5;
  const center = (height - 2 * padding) / 2 + padding;

  return (
    <div
      className={styles.player}
      onMouseOver={() => setIsControlsOpen(true)}
      onMouseOut={() => setIsControlsOpen(false)}
    >
      <audio ref={audioRef} src={objectUrl} preload='metadata' />

      <button onClick={togglePlay} className={styles.play}>
        {isPlaying ? <Icon name='Pause' /> : <Icon name='Play' />}
      </button>

      <div className={styles.timeline}>
        <div
          ref={progressRef}
          className={styles.progress}
          // onClick={seek}
          onMouseDown={startSeek}
          onTouchMove={startSeek}
        >
          {!waveform && (
            <div className={styles.progressFillWrapper}>
              <div
                className={styles.progressFill}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
          {waveform && (
            <svg width={svgWidth} height={height}>
              <defs>
                <mask
                  id={id}
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
                width={(visualTime / durationState) * svgWidth}
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
          {formatTime(currentTime)} / {formatTime(durationState)}
        </div>
        <div className={`${styles.controls} ${isControlsOpen && styles.open} `}>
          <button className={styles.speed} onClick={cycleSpeed}>
            {speed}×
          </button>

          <div ref={volumeWrapperRef} className={styles.volumeWrapper}>
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
        </div>
      </div>
    </div>
  );
}
