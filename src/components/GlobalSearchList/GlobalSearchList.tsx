import { useSearchContext } from '@/contexts/search/SearchContext';
//@ts-ignore
import type { User } from '@/contexts/UserContext';
import styles from './GlobalSearchList.module.scss';
import Avatar from '../Avatar/Avatar';
import { useChat } from '@/contexts/ChatContext';

const GlobalSearchList: React.FC = () => {
  const { results, loading, error } = useSearchContext();

  if (loading) return <div>Loading...</div>;
  if (error) return <div className='text-red-500'>{error}</div>;
  //   if (!results.length) return <div>No results</div>;
  console.log('results', results);
  const { handleCreateTemporaryChat } = useChat();
  return (
    <ul className={styles['search-list']}>
      {results.map((user) => (
        <li
          key={user.id}
          className={styles['search-item']}
          onClick={() => {
            //@ts-ignore
            console.log('handleCreateTemporaryChat', user);
            //@ts-ignore
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
