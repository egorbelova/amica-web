// contexts/contacts/useContacts.ts
import { useEffect, useState, useMemo } from 'react';
import { apiFetch } from '@/utils/apiFetch';

export type Contact = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  primary_media?: any;
  chat_id: number;
};

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
      } catch (err: any) {
        setError(err.message);
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
        c.phone?.toLowerCase().includes(lower)
    );
  };

  return { contacts, loading, error, searchContacts };
}
