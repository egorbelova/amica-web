import { useTranslation } from '@/contexts/languageCore';
import Avatar from '@/components/Avatar/Avatar';
import styles from './Contacts.module.scss';
import { useChat } from '@/contexts/ChatContextCore';
import { useContacts } from '@/contexts/contacts/useContacts';

const Contacts = () => {
  const { t } = useTranslation();
  const { handleChatClick } = useChat();
  const { contacts, loading, error } = useContacts();

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
              onClick={() => handleChatClick(contact.chat_id)}
            >
              <Avatar
                className={styles.avatar}
                displayName={contact.name}
                displayMedia={contact.primary_media}
              />
              <span className={styles.username}>{contact.name}</span>
              <span className={styles.email}>{contact.last_seen}</span>
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
