import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/contexts/languageCore';
import { apiFetch, apiJson } from '@/utils/apiFetch';
import { useUser } from '@/contexts/UserContextCore';
import type { PasskeyCredentialItem } from '@/types';

export function usePasskeys() {
  const { t } = useTranslation();
  const { user } = useUser();
  const [passkeys, setPasskeys] = useState<PasskeyCredentialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPasskeys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiJson<{ passkeys?: PasskeyCredentialItem[] }>(
        '/api/passkeys/',
      );
      setPasskeys(Array.isArray(data.passkeys) ? data.passkeys : []);
    } catch {
      setError(t('profile.passkeysLoadError'));
      setPasskeys([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadPasskeys();
  }, [loadPasskeys, user?.id]);

  const removePasskey = useCallback(
    async (id: string) => {
      const res = await apiFetch(`/api/passkeys/${id}/`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('remove failed');
      }
      await loadPasskeys();
    },
    [loadPasskeys],
  );

  return { passkeys, loading, error, loadPasskeys, removePasskey };
}
