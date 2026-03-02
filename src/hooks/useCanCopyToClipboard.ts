import { useState, useEffect, useCallback, useRef } from 'react';

async function checkClipboard(): Promise<boolean> {
  try {
    if (!navigator.clipboard?.write) return false;
    if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({
          name: 'clipboard-write' as PermissionName,
        });
        return result.state !== 'denied';
      } catch {
        // fall through to test write
      }
    }
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    const testItem = new ClipboardItem({ 'text/plain': testBlob });
    await navigator.clipboard.write([testItem]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Detects if the clipboard write API is available and not denied by permission.
 * Runs the check on mount → causes one extra re-render when done.
 */
export function useCanCopyToClipboard(): boolean {
  const [canCopy, setCanCopy] = useState(false);

  useEffect(() => {
    checkClipboard().then(setCanCopy);
  }, []);

  return canCopy;
}

/**
 * Same as useCanCopyToClipboard but runs the check only when triggerCheck() is called.
 * Use in MessageList and call triggerCheck when the context menu opens → no extra init re-renders.
 */
export function useLazyCanCopyToClipboard(): {
  canCopy: boolean;
  triggerCheck: () => void;
} {
  const [canCopy, setCanCopy] = useState(false);
  const didRun = useRef(false);

  const triggerCheck = useCallback(() => {
    if (didRun.current) return;
    didRun.current = true;
    checkClipboard().then(setCanCopy);
  }, []);

  return { canCopy, triggerCheck };
}
