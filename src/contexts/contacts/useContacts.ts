// contexts/contacts/useContacts.ts
import { useEffect, useState } from 'react';
import { apiFetch } from '@/utils/apiFetch';
import type { Contact } from '@/types';

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await apiFetch('/api/get_contacts/');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setContacts(data.contacts);
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
        c.name.toLowerCase().includes(lower) ||
        c.email?.toLowerCase().includes(lower) ||
        c.phone?.toLowerCase().includes(lower),
    );
  };

  return { contacts, loading, error, searchContacts };
}
