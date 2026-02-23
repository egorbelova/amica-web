import styles from './Profile.module.scss';
import { useState } from 'react';

const ColorPreview = ({
  color,
  onClick,
}: {
  color: string;
  onClick: () => void;
}) => {
  const [isPulsing, setIsPulsing] = useState(false);

  return (
    <button
      className={`${styles.suggestedColorPreview} ${isPulsing ? styles.active : ''}`}
      style={{ backgroundColor: color }}
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
