import React, { useRef, useState, useEffect, useCallback } from 'react';
import styles from './Slider.module.scss';

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  color?: string;
}

const Slider: React.FC<SliderProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
  color = '#007bff',
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [internalValue, setInternalValue] = useState(value);

  const thumbWidth = 24;
  const thumbInset = thumbWidth / 3;
  useEffect(() => setInternalValue(value), [value]);

  const clampValue = useCallback(
    (val: number) => Math.min(Math.max(val, min), max),
    [min, max],
  );

  const calcValueFromPos = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return internalValue;
      const { left, width } = trackRef.current.getBoundingClientRect();
      const fullRange = width - 2 * thumbInset;
      let percent = (clientX - left - thumbInset) / fullRange;
      percent = Math.min(Math.max(percent, 0), 1);
      return min + percent * (max - min);
    },
    [min, max, internalValue, thumbInset],
  );

  const calcThumbLeft = useCallback(
    (val: number) => {
      if (!trackRef.current) return 0;
      const { width } = trackRef.current.getBoundingClientRect();
      const percent = (val - min) / (max - min);
      const fullRange = width - 2 * thumbInset;
      return thumbInset + percent * fullRange;
    },
    [min, max, thumbInset],
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    const val = calcValueFromPos(e.clientX);
    setInternalValue(val);
    onChange(val);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging) return;
      const val = calcValueFromPos(e.clientX);
      setInternalValue(val);
      onChange(val);
    },
    [dragging, calcValueFromPos, onChange],
  );

  const handleMouseUp = useCallback(() => {
    setDragging(false);
    const rounded = Math.round(internalValue / step) * step;
    const clamped = clampValue(rounded);
    setInternalValue(clamped);
    onChange(clamped);
  }, [internalValue, step, clampValue, onChange]);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, handleMouseMove, handleMouseUp]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setDragging(true);
    const touch = e.touches[0];
    const val = calcValueFromPos(touch.clientX);
    setInternalValue(val);
    onChange(val);
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!dragging) return;
      const touch = e.touches[0];
      const val = calcValueFromPos(touch.clientX);
      setInternalValue(val);
      onChange(val);
    },
    [dragging, calcValueFromPos, onChange],
  );

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
    const rounded = Math.round(internalValue / step) * step;
    const clamped = clampValue(rounded);
    setInternalValue(clamped);
    onChange(clamped);
  }, [internalValue, step, clampValue, onChange]);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    dragging,
    handleMouseMove,
    handleMouseUp,
    handleTouchMove,
    handleTouchEnd,
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = Number(e.target.value);
    if (isNaN(val)) return;
    val = clampValue(Math.round(val / step) * step);
    setInternalValue(val);
    onChange(val);
  };

  const thumbLeft = calcThumbLeft(internalValue);

  const calcFillWidth = (val: number) => {
    if (!trackRef.current) return 0;
    const { width } = trackRef.current.getBoundingClientRect();
    const percent = (val - min) / (max - min);
    const edge = 0.1;
    const padding = thumbInset;

    const fullRange = width - 2 * padding;
    const centerThumb = padding + percent * fullRange;

    const edgeEaseStart = (t: number) => Math.pow(t, 0.6);
    const edgeEaseEnd = (t: number) => 1 - Math.pow(1 - t, 0.6);

    if (percent < edge) {
      const start = 0;
      const end = padding + edge * fullRange;
      const t = edgeEaseStart(percent / edge);
      return start + t * (end - start);
    } else if (percent > 1 - edge) {
      const start = padding + (1 - edge) * fullRange;
      const end = width;
      const t = edgeEaseEnd((percent - (1 - edge)) / edge);
      return start + t * (end - start);
    } else {
      return centerThumb;
    }
  };

  const fillWidth = calcFillWidth(internalValue);

  return (
    <div className={styles.sliderWrapper}>
      {label && (
        <div className={styles.label}>
          {label}:
          <input
            className={styles.value}
            value={Math.round(internalValue)}
            onChange={handleInputChange}
          />
        </div>
      )}
      <div
        className={`${styles.track} ${dragging ? styles.dragging : ''}`}
        ref={trackRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div
          className={styles.fill}
          style={{
            width: `${fillWidth}px`,
            backgroundColor: color,
          }}
        />
        <div
          className={styles.thumb}
          style={{
            left: `${thumbLeft}px`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
};

export default Slider;
