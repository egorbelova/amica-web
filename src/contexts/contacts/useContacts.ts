// contexts/contacts/useContacts.ts
import { useEffect, useState } from 'react';
import { apiFetch } from '@/utils/apiFetch';
import { websocketManager } from '@/utils/websocket-manager';
import type { Contact } from '@/types';

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      setError(null);

      if (websocketManager.isConnected()) {
        const timeoutId = window.setTimeout(() => {
          setLoading(false);
        }, 15000);

        const handleContacts = (data: { type?: string; contacts?: unknown[] }) => {
          if (data.type !== 'contacts') return;
          window.clearTimeout(timeoutId);
          setContacts(Array.isArray(data.contacts) ? (data.contacts as Contact[]) : []);
          setLoading(false);
          websocketManager.off('contacts', handleContacts);
          websocketManager.off('message', handleError);
        };

        const handleError = (msg: { type?: string; message?: string }) => {
          if (msg.type === 'error') {
            window.clearTimeout(timeoutId);
            setError(msg.message ?? 'Failed to load contacts');
            setLoading(false);
            websocketManager.off('contacts', handleContacts);
            websocketManager.off('message', handleError);
          }
        };

        websocketManager.on('contacts', handleContacts);
        websocketManager.on('message', handleError);
        websocketManager.sendMessage({ type: 'get_contacts' });
        return;
      }

      try {
        const res = await apiFetch('/api/get_contacts/');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setContacts(data.contacts ?? []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  const searchContacts = (query: string) => {
    if (!query) return contacts;
    const lower = query.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name?.toLowerCase().includes(lower) ||
        (c as { email?: string }).email?.toLowerCase().includes(lower) ||
        (c as { phone?: string }).phone?.toLowerCase().includes(lower),
    );
  };

  return { contacts, loading, error, searchContacts };
}
