import styles from './Profile.module.scss';
import { useState } from 'react';
import type { GradientSuggested } from '@/contexts/settings/types';

const ColorPreview = ({
  color,
  gradient,
  onClick,
}: {
  color?: string;
  gradient?: GradientSuggested | null;
  onClick: () => void;
}) => {
  const [isPulsing, setIsPulsing] = useState(false);

  const style = gradient?.colors?.length
    ? {
        background: `linear-gradient(${gradient.degree ?? '90deg'}, ${gradient.colors.map((c) => `${c.color} ${c.stop}`).join(', ')})`,
        border: 'none',
      }
    : color
      ? { backgroundColor: color }
      : undefined;

  return (
    <button
      className={`${styles.suggestedColorPreview} ${isPulsing ? styles.active : ''}`}
      style={style}
      onClick={() => {
        onClick();
      }}
      onPointerDown={() => {
        setIsPulsing(true);
      }}
      onPointerUp={() => {
        setTimeout(() => {
          setIsPulsing(false);
        }, 100);
      }}
    />
  );
};

export default ColorPreview;
