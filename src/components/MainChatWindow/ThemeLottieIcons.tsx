import { memo, useEffect, useRef } from 'react';
import Lottie, { type LottieRefCurrentProps } from 'lottie-react';
import lightThemeLottie from '@/icons/animated/LightTheme.json';
import darkThemeLottie from '@/icons/animated/DarkTheme.json';
import styles from './AppearanceMenu.module.scss';

type ThemeLottieVariant = 'light' | 'dark';

const animationData: Record<ThemeLottieVariant, object> = {
  light: lightThemeLottie,
  dark: darkThemeLottie,
};

const ThemeLottieIconInner = function ThemeLottieIcon({
  variant,
  isActive,
  className,
}: {
  variant: ThemeLottieVariant;
  isActive: boolean;
  className?: string;
}) {
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);
  const didInitRef = useRef(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    const api = lottieRef.current;
    if (!api) return;

    const getLastFrame = () => {
      const durFrames = api.getDuration?.(true);
      if (typeof durFrames === 'number' && Number.isFinite(durFrames)) {
        return Math.max(0, Math.floor(durFrames) - 1);
      }
      const total = api.animationItem?.totalFrames;
      if (typeof total === 'number' && Number.isFinite(total)) {
        return Math.max(0, Math.floor(total) - 1);
      }
      return 0;
    };

    if (!didInitRef.current) {
      api.goToAndStop(getLastFrame(), true);
      didInitRef.current = true;
    }

    const item = api.animationItem;

    if (isActive) {
      finishedRef.current = false;

      const onComplete = () => {
        finishedRef.current = true;
      };

      item?.addEventListener?.('complete', onComplete);

      api.setDirection?.(1);
      api.goToAndPlay(0, true);

      return () => {
        item?.removeEventListener?.('complete', onComplete);
      };
    }

    if (finishedRef.current) {
      api.goToAndStop(getLastFrame(), true);
      return;
    }

    api.setDirection?.(1);
    api.play?.();
  }, [isActive]);

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={animationData[variant]}
      autoplay={false}
      loop={false}
      className={className ?? styles.themeLottie}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export const ThemeLottieIcon = memo(ThemeLottieIconInner);
