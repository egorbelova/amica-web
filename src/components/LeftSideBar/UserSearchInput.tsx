import { useRef, useContext } from 'react';
import Avatar from '../Avatar/Avatar';
import { Icon } from '../Icons/AutoIcons';
import styles from './UserSearchInput.module.scss';
import './UserSearchInput.css';
import { UserSearchContext } from '@/contexts/userSearch/UserSearchContext';

const UserSearchInput = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const context = useContext(UserSearchContext);

  if (!context) {
    throw new Error('UserSearchInput must be used within a UserSearchProvider');
  }

  const { searchTerm, results, loading, error, onChange, clear } = context;

  return (
    <div className='search_div' id='search'>
      <div className='liquidGlass-effect'></div>
      <div className='liquidGlass-tint'></div>
      <div className='liquidGlass-shine'></div>

      <div className='search_field_div'>
        <div className='search_icon_div'>
          {/* <Icon name='search-icon' className='search_icon' /> */}
        </div>
        <div className='search_field_input'>
          <input
            aria-label='Search'
            className='search_field'
            name='term'
            placeholder=' '
            value={searchTerm}
            onChange={(e) => onChange(e.target.value)}
            ref={inputRef}
          />
          <span className='search_field_placeholder'>Search</span>
        </div>
      </div>

      <div className='search_cross_div' onClick={clear}>
        <svg className='search_cross'>
          <use href='#cross-icon'></use>
        </svg>
      </div>
    </div>
  );
};

export default UserSearchInput;
