import { useRef, useCallback, useMemo } from 'react';
import styles from './Profile.module.scss';
import { useSettings } from '@/contexts/settings/context';
import Input from '../SideBarMedia/Input';
import ColorPreview from './ColorPreview';

const suggestedColors = [
  '#007AFF',
  '#5AC8FA',
  '#5856D6',
  '#6A5ACD',
  '#30B0C7',
  '#20B2AA',
  '#34C759',
  '#FF3B30',
  '#FF2D55',
  '#FF375F',
  '#FFB07C',
  '#FF9E7B',
  '#8E8E93',
  '#000000',
];
const parseToHSL = (inputColor: string) => {
  const temp = document.createElement('div');
  temp.style.color = inputColor;
  document.body.appendChild(temp);

  const computed = getComputedStyle(temp).color;
  document.body.removeChild(temp);

  const match = computed.match(/rgb\((\d+), (\d+), (\d+)\)/);
  if (!match) return null;

  const r = Number(match[1]) / 255;
  const g = Number(match[2]) / 255;
  const b = Number(match[3]) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));

    switch (max) {
      case r:
        h = ((g - b) / delta) % 6;
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      case b:
        h = (r - g) / delta + 4;
        break;
    }

    h *= 60;
    if (h < 0) h += 360;
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

const ColorPicker = () => {
  const { setColor, color } = useSettings();

  const hueRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);

  const parsed = useMemo(() => parseToHSL(color), [color]);
  const hue = parsed?.h ?? 210;
  const saturation = parsed?.s ?? 100;
  const lightness = parsed?.l ?? 50;

  const animationFrameRef = useRef<number | null>(null);
  const targetColorRef = useRef({ h: hue, s: saturation, l: lightness });

  const updateColor = useCallback(
    (h: number, s: number, l: number) => {
      targetColorRef.current = { h, s, l };
      if (animationFrameRef.current === null) {
        animationFrameRef.current = requestAnimationFrame(() => {
          const { h, s, l } = targetColorRef.current;
          setColor(`hsl(${h}, ${s}%, ${l}%)`);
          animationFrameRef.current = null;
        });
      }
    },
    [setColor],
  );

  const handleHue = useCallback(
    (clientX: number) => {
      const el = hueRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      const newHue = Math.round((x / rect.width) * 360);

      updateColor(newHue, saturation, lightness);
    },
    [saturation, lightness, updateColor],
  );

  const handleArea = useCallback(
    (clientX: number, clientY: number) => {
      const el = areaRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      const y = Math.min(Math.max(clientY - rect.top, 0), rect.height);

      const newS = Math.round((x / rect.width) * 100);
      const newL = Math.round(100 - (y / rect.height) * 100);

      updateColor(hue, newS, newL);
    },
    [hue, updateColor],
  );

  const handleSuggestedColorClick = useCallback(
    (color: string) => {
      setColor(color);
    },
    [setColor],
  );

  return (
    <div className={styles.colorPickerContainer}>
      <div className={styles.suggestedColors}>
        <div className={styles.suggestedColorsTitle}>Suggestions</div>
        <div className={styles.suggestedColorsContainer}>
          {suggestedColors.map((color) => (
            <ColorPreview
              onClick={() => handleSuggestedColorClick(color)}
              key={color}
              color={color}
            />
          ))}
        </div>
      </div>

      <div className={styles.colorInfo}>
        <div className={styles.colorPickerPreview} />
        <Input
          placeholder='Color'
          value={color}
          onChange={(value) => setColor(value)}
        />
      </div>
      <div
        ref={areaRef}
        className={styles.colorArea}
        style={{ background: `hsl(${hue}, 100%, 50%)` }}
        onPointerDown={(e) => handleArea(e.clientX, e.clientY)}
        onPointerMove={(e) =>
          e.buttons === 1 && handleArea(e.clientX, e.clientY)
        }
      >
        <div className={styles.colorAreaOverlayWhite} />
        <div className={styles.colorAreaOverlayBlack} />

        <div
          className={styles.colorThumb}
          style={{
            left: `${saturation}%`,
            top: `${100 - lightness}%`,
          }}
        />
      </div>
      <div
        ref={hueRef}
        className={styles.colorPickerBar}
        onPointerDown={(e) => handleHue(e.clientX)}
        onPointerMove={(e) => e.buttons === 1 && handleHue(e.clientX)}
      >
        <div
          className={styles.hueThumb}
          style={{
            left: `${(hue / 360) * 100}%`,
          }}
        />
      </div>
    </div>
  );
};

export default ColorPicker;
