import { useEffect, useState } from 'react';

export function useStickyTabs(tabsRef: React.RefObject<HTMLDivElement | null>) {
  const [attachmentsActive, setAttachmentsActive] = useState(false);

  useEffect(() => {
    const tabs = tabsRef.current;
    if (!tabs?.parentElement) return;

    const parent = tabs.parentElement;
    const sentinel = document.createElement('div');
    sentinel.style.height = '1px';
    parent.insertBefore(sentinel, tabs);

    const stickyTop = getComputedStyle(tabs).top;
    const observer = new IntersectionObserver(
      ([entry]) => setAttachmentsActive(!entry.isIntersecting),
      {
        root: null,
        threshold: 0,
        rootMargin: `-${stickyTop} 0px 0px 0px`,
      },
    );
    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      sentinel.remove();
    };
  }, [tabsRef]);

  return attachmentsActive;
}
