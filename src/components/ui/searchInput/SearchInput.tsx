import { useRef } from 'react';
import { Icon } from '@/components/Icons/AutoIcons';
import './SearchInput.css';
import { useSearchContext } from '@/contexts/search/SearchContextCore';

const searchIcon = <Icon name='Search' className='search_icon' />;

export interface SearchInputProps {
  placeholder?: string;
  /** Controlled mode: pass value + onChange (and optional onClear) to use local state instead of search context */
  value?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
}

const SearchInput = ({
  placeholder = 'Search',
  value: valueProp,
  onChange: onChangeProp,
  onClear: onClearProp,
}: SearchInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const context = useSearchContext();
  const isControlled =
    valueProp !== undefined && onChangeProp !== undefined;
  const value = isControlled ? valueProp : context.term;
  const onChange = isControlled ? onChangeProp : context.onChange;
  const clear = isControlled
    ? (onClearProp ?? (() => onChangeProp?.('')))
    : context.clear;

  return (
    <div className='search_div' id='search'>
      <div className='liquidGlass-effect'></div>
      <div className='liquidGlass-tint'></div>
      <div className='liquidGlass-shine'></div>

      <div className='search_field_div'>
        <div className='search_icon_div'>{searchIcon}</div>
        <div className='search_field_input'>
          <input
            aria-label='Search'
            className='search_field'
            name='term'
            placeholder=' '
            value={value}
            onChange={(e) => onChange(e.target.value)}
            ref={inputRef}
            autoComplete='off'
            type='text'
          />
          <span className={`search_field_placeholder ${value ? 'input' : ''}`}>
            {placeholder}
          </span>
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

export default SearchInput;
