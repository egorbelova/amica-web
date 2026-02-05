import { useEffect, useState } from 'react';

export function useJumpToBottom(containerRef, offset = 50) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      setIsVisible(el.scrollTop > offset);
    };

    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [containerRef, offset]);

  const jumpToBottom = () => {
    const el = containerRef.current;
    if (!el) return;

    el.scrollTo({
      top: el.scrollHeight,
      behavior: 'smooth',
    });
  };

  return { isVisible, jumpToBottom };
}
