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

  useEffect(() => setInternalValue(value), [value]);

  const clampValue = useCallback(
    (val: number) => Math.min(Math.max(val, min), max),
    [min, max]
  );

  const calcValueFromPos = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return internalValue;
      const { left, width } = trackRef.current.getBoundingClientRect();
      let percent = (clientX - left) / width;
      percent = Math.min(Math.max(percent, 0), 1);
      let newValue = min + percent * (max - min);
      newValue = Math.round(newValue / step) * step;
      return newValue;
    },
    [min, max, step, internalValue]
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
    [dragging, calcValueFromPos, onChange]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = Number(e.target.value);
    if (isNaN(val)) return;
    val = clampValue(Math.round(val / step) * step);
    setInternalValue(val);
    onChange(val);
  };

  const fillPercent = ((internalValue - min) / (max - min)) * 100;

  return (
    <div className={styles.sliderWrapper}>
      {label && (
        <div className={styles.label}>
          {label}:
          <input
            className={styles.value}
            value={internalValue}
            onChange={handleInputChange}
          />
        </div>
      )}
      <div
        className={`${styles.track} ${dragging ? styles.dragging : ''}`}
        ref={trackRef}
        onMouseDown={handleMouseDown}
      >
        <div
          className={styles.fill}
          style={{ width: `${fillPercent}%`, backgroundColor: color }}
        />
        <div
          className={styles.thumb}
          style={{ left: `${fillPercent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

export default Slider;
