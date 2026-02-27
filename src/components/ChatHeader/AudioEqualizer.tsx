import { useEffect, useRef } from 'react';
import styles from './ChatHeader.module.scss';
import { useAudio } from '@/contexts/audioContext';
import Button from '../ui/button/Button';

const BARS_COUNT = 6;
const MIN_HEIGHT_PERCENT = 0;
const SMOOTHING = 0.65;
const SENSITIVITY = 2;
const MAX_FREQ_HZ = 8000;

let sharedElement: HTMLAudioElement | null = null;
let sharedContext: AudioContext | null = null;
let sharedAnalyser: AnalyserNode | null = null;

const AudioEqualizer = () => {
  const { audioRef, currentAudioId } = useAudio();
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const smoothedRef = useRef<number[]>(
    Array(BARS_COUNT).fill(MIN_HEIGHT_PERCENT),
  );
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!audioRef?.current) return;

    const audio = audioRef.current;
    let audioContext: AudioContext;
    let analyser: AnalyserNode;

    if (
      sharedElement === audio &&
      sharedContext?.state !== 'closed' &&
      sharedAnalyser
    ) {
      audioContext = sharedContext;
      analyser = sharedAnalyser;
    } else {
      if (sharedContext?.state !== 'closed') {
        sharedContext?.close();
      }
      sharedElement = audio;
      audioContext = new AudioContext();
      sharedContext = audioContext;
      analyser = audioContext.createAnalyser();
      sharedAnalyser = analyser;
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.7;
      analyser.minDecibels = -70;
      analyser.maxDecibels = 0;

      const source = audioContext.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const smoothed = smoothedRef.current;
    const binCount = dataArray.length;
    const maxBin = Math.min(
      binCount - 1,
      Math.floor((MAX_FREQ_HZ * analyser.fftSize) / audioContext.sampleRate),
    );
    const effectiveBins = maxBin + 1;
    const step = Math.floor(effectiveBins / BARS_COUNT);

    const update = () => {
      analyser.getByteFrequencyData(dataArray);

      for (let i = 0; i < BARS_COUNT; i++) {
        const start = i * step;
        const end = i < BARS_COUNT - 1 ? (i + 1) * step : effectiveBins;
        let sum = 0;
        let maxV = 0;
        for (let j = start; j < end; j++) {
          sum += dataArray[j];
          if (dataArray[j] > maxV) maxV = dataArray[j];
        }
        const average = end > start ? sum / (end - start) : 0;
        const value = i >= 4 ? maxV : average;
        const rawPercent = (value / 255) * 100;
        const target = Math.max(
          MIN_HEIGHT_PERCENT,
          Math.min(100, rawPercent * SENSITIVITY),
        );
        smoothed[i] = smoothed[i] * SMOOTHING + target * (1 - SMOOTHING);

        const el = barRefs.current[i];
        if (el) el.style.height = `${Math.round(smoothed[i])}%`;
      }

      animationRef.current = requestAnimationFrame(update);
    };

    update();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [audioRef]);

  if (!currentAudioId) return null;

  return (
    <Button key={'audio-equalizer-button'}>
      <div className={styles['audio-equalizer']}>
        {Array.from({ length: BARS_COUNT }, (_, i) => (
          <div key={i} className={styles['audio-equalizer__bar']}>
            <div
              ref={(el) => {
                barRefs.current[i] = el;
              }}
              className={styles['audio-equalizer__bar__inner']}
              style={{ height: `${MIN_HEIGHT_PERCENT}%` }}
            />
          </div>
        ))}
      </div>
    </Button>
  );
};

export default AudioEqualizer;
