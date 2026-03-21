import { useEffect, useRef } from 'react';
import Lottie, { type LottieRefCurrentProps } from 'lottie-react';
import editData from '@/icons/animated/Edit.json';
import deleteData from '@/icons/animated/Delete.json';
import photoData from '@/icons/animated/Photo.json';
import styles from './ContextMenu.module.scss';

export type ContextMenuAnimatedIcon = 'edit' | 'delete' | 'photo';

type LottieJson = {
  ip?: number;
  op?: number;
  markers?: ReadonlyArray<{ tm: number; cm: string; dr: number }>;
};

const animationByVariant: Record<ContextMenuAnimatedIcon, LottieJson> = {
  edit: editData as LottieJson,
  delete: deleteData as LottieJson,
  photo: photoData as LottieJson,
};

function hoverSegment(data: LottieJson): { start: number; end: number } {
  const ip = typeof data.ip === 'number' ? data.ip : 0;
  const op = typeof data.op === 'number' ? data.op : 1e9;
  const markers = data.markers ?? [];
  const candidates = markers.filter(
    (m) =>
      m.cm.toLowerCase().includes('hover') && m.tm + 1 >= ip && m.tm <= op + 1,
  );
  const m =
    candidates.length > 0
      ? candidates.reduce((a, b) => (a.tm >= b.tm ? a : b))
      : null;
  if (!m) {
    const end = Math.max(0, Math.floor((data.op ?? 60) - 1));
    return { start: 0, end };
  }
  const start = Math.floor(m.tm);
  const end = Math.max(start, Math.ceil(m.tm + m.dr) - 1);
  return { start, end };
}

const segments: Record<
  ContextMenuAnimatedIcon,
  { start: number; end: number }
> = {
  edit: hoverSegment(animationByVariant.edit),
  delete: hoverSegment(animationByVariant.delete),
  photo: hoverSegment(animationByVariant.photo),
};

type AnimItem = NonNullable<LottieRefCurrentProps['animationItem']> & {
  playSegments?: (seg: [number, number] | number[], force?: boolean) => void;
  firstFrame?: number;
};

export function ContextMenuItemLottie({
  variant,
  isHovered,
  className,
}: {
  variant: ContextMenuAnimatedIcon;
  isHovered?: boolean;
  className?: string;
}) {
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);
  const didInitRef = useRef(false);
  const finishedRef = useRef(false);
  const hovered = isHovered ?? false;
  const segment = segments[variant];
  const animationData = animationByVariant[variant];

  useEffect(() => {
    const api = lottieRef.current;
    if (!api) return;

    const item = api.animationItem as AnimItem | undefined;
    const firstFrameBase = item?.firstFrame ?? segment.start;
    const relHoverStart = Math.max(0, segment.start - firstFrameBase);
    const relHoverIdle = Math.max(0, segment.end - firstFrameBase);

    if (!didInitRef.current) {
      api.goToAndStop(relHoverIdle, true);
      didInitRef.current = true;
    }

    if (hovered) {
      finishedRef.current = false;

      const onComplete = () => {
        finishedRef.current = true;
      };

      item?.addEventListener?.('complete', onComplete);

      api.setDirection?.(1);
      if (typeof item?.playSegments === 'function') {
        item.playSegments([segment.start, segment.end], true);
      } else {
        api.goToAndStop(relHoverStart, true);
        api.play?.();
      }

      return () => {
        item?.removeEventListener?.('complete', onComplete);
      };
    }

    if (finishedRef.current) {
      api.goToAndStop(relHoverIdle, true);
      return;
    }

    api.setDirection?.(1);
    api.play?.();
  }, [hovered, segment.start, segment.end]);

  return (
    <div className={styles['context-menu__item-lottie-wrap']}>
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        autoplay={false}
        loop={false}
        className={className ?? styles['context-menu__item-lottie']}
        style={{ width: '1.25rem', height: '1.25rem' }}
      />
    </div>
  );
}
