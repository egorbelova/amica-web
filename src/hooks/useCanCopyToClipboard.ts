import { useState, useEffect } from 'react';

/**
 * Detects if the clipboard write API is available and not denied by permission.
 */
export function useCanCopyToClipboard(): boolean {
  const [canCopy, setCanCopy] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        if (!navigator.clipboard?.write) {
          setCanCopy(false);
          return;
        }
        if (navigator.permissions) {
          try {
            const result = await navigator.permissions.query({
              name: 'clipboard-write' as PermissionName,
            });
            setCanCopy(result.state !== 'denied');
            return;
          } catch {
            // fall through to test write
          }
        }
        const testBlob = new Blob(['test'], { type: 'text/plain' });
        const testItem = new ClipboardItem({ 'text/plain': testBlob });
        await navigator.clipboard.write([testItem]);
        setCanCopy(true);
      } catch {
        setCanCopy(false);
      }
    };
    check();
  }, []);

  return canCopy;
}
