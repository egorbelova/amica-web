import { useEffect, useState } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import Avatar from '@/components/Avatar/Avatar';
import styles from './Contacts.module.scss';
import { useChat } from '@/contexts/ChatContext';
import { apiFetch } from '@/utils/apiFetch';

type Contact = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  primary_media?: any;
  chat_id: number;
};

const Contacts = () => {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { handleChatClick } = useChat();
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await apiFetch('/api/get_contacts/');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        console.log(data.contacts);
        setContacts(data.contacts);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  if (loading) return <div>{t('contacts.loading') ?? 'Loading...'}</div>;
  if (error) return <div>{t('contacts.error') ?? `Error: ${error}`}</div>;

  return (
    <div>
      <ul>
        {contacts.length > 0 ? (
          contacts.map((contact) => (
            <li
              key={contact.id}
              className={styles.contactItem}
              onClick={handleChatClick.bind(null, contact.chat_id)}
            >
              <Avatar
                className={styles.avatar}
                displayName={contact.name}
                displayMedia={contact.primary_media}
              />
              <span className={styles.username}>{contact.name}</span>
            </li>
          ))
        ) : (
          <li>{t('contacts.empty')}</li>
        )}
      </ul>
    </div>
  );
};

export default Contacts;
