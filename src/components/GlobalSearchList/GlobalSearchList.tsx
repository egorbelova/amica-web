import { useSearchContext } from '@/contexts/search/SearchContextCore';
import type { User } from '@/types';
import styles from './GlobalSearchList.module.scss';
import Avatar from '../Avatar/Avatar';
import { useChat } from '@/contexts/ChatContextCore';

const GlobalSearchList: React.FC = () => {
  const { results, loading, error } = useSearchContext<User>();

  if (loading) return <div>Loading...</div>;
  if (error) return <div className='text-red-500'>{error}</div>;
  //   if (!results.length) return <div>No results</div>;

  const { handleCreateTemporaryChat } = useChat();
  return (
    <ul className={styles['search-list']}>
      {results.map((user) => (
        <li
          key={user.id}
          className={styles['search-item']}
          onClick={() => {
            handleCreateTemporaryChat(user);
          }}
        >
          <Avatar
            displayName={user.username}
            displayMedia={user.profile.primary_avatar}
            className={styles.avatar}
          />
          <div className={styles.info}>
            <span className={styles.name}>{user.username}</span>
            <span className={styles.email}>{user.email}</span>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default GlobalSearchList;
