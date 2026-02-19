import { useCallback } from 'react';

export function useMergedRefs<T = unknown>(refs: Array<React.Ref<T> | null>) {
  return useCallback(
    (node: T | null) => {
      refs.forEach((ref) => {
        if (!ref) return;
        if (typeof ref === 'function') ref(node);
        else (ref as React.MutableRefObject<T | null>).current = node;
      });
    },
    [refs],
  );
}
