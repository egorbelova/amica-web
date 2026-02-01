import { useRef, useContext } from 'react';
import Avatar from '@/components/Avatar/Avatar';
import { Icon } from '@/components/Icons/AutoIcons';
import styles from './UserSearchInput.module.scss';
import './SearchInput.css';
import { useSearchContext } from '@/contexts/search/SearchContext';

const UserSearchInput = ({ placeholder = 'Search' }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { term, onChange, clear } = useSearchContext();
  return (
    <div className='search_div' id='search'>
      <div className='liquidGlass-effect'></div>
      <div className='liquidGlass-tint'></div>
      <div className='liquidGlass-shine'></div>

      <div className='search_field_div'>
        <div className='search_icon_div'>
          <Icon name='Search' className='search_icon' />
        </div>
        <div className='search_field_input'>
          <input
            aria-label='Search'
            className='search_field'
            name='term'
            placeholder=' '
            value={term}
            onChange={(e) => onChange(e.target.value)}
            ref={inputRef}
            autoComplete='off'
            type='text'
          />
          <span className={`search_field_placeholder ${term ? 'input' : ''}`}>
            {placeholder}
          </span>
        </div>
      </div>
      {/* <button className={styles['chat-actions-button']} type='button'>
        <Icon name='AddPlus' className={styles['chat-actions-icon']} />
      </button> */}

      <div className='search_cross_div' onClick={clear}>
        <svg className='search_cross'>
          <use href='#cross-icon'></use>
        </svg>
      </div>
    </div>
  );
};

export default UserSearchInput;
