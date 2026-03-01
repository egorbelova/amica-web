import React, { memo } from 'react';
import { Icon } from '@/components/Icons/AutoIcons';
import { Dropdown } from '@/components/Dropdown/Dropdown';
import type { DropdownItem } from '@/components/Dropdown/Dropdown';
import Button from '@/components/ui/button/Button';
import styles from './SideBarMedia.module.scss';

interface SideBarMediaHeaderProps {
  onBackOrClose: () => void;
  showEditButton: boolean;
  onEditClick: () => void;
  editLabel: string;
  attachmentsActive: boolean;
  showFilterDropdown: boolean;
  interlocutorEditVisible: boolean;
  filterItems: DropdownItem<number>[];
  effectiveFilterType: string;
  onFilterChange: (label: string) => void;
}

const SideBarMediaHeader: React.FC<SideBarMediaHeaderProps> = ({
  onBackOrClose,
  showEditButton,
  onEditClick,
  editLabel,
  attachmentsActive,
  showFilterDropdown,
  interlocutorEditVisible,
  filterItems,
  effectiveFilterType,
  onFilterChange,
}) => (
  <div className={styles.header}>
    <Button
      key="sidebar-header-button"
      onClick={onBackOrClose}
      className={styles.button}
    >
      {interlocutorEditVisible ? (
        <Icon name="Arrow" style={{ transform: 'rotate(180deg)' }} />
      ) : (
        <Icon name="Cross" />
      )}
    </Button>

    {showEditButton && !attachmentsActive && (
      <Button
        key="sidebar-header-button-edit"
        className={`${styles.button} ${
          interlocutorEditVisible ? styles.hidden : ''
        }`}
        onClick={onEditClick}
      >
        {editLabel}
      </Button>
    )}

    {attachmentsActive && showFilterDropdown && (
      <>
        <Dropdown
          items={filterItems}
          placeholder=""
          value={
            filterItems.find((item) => item.label === effectiveFilterType)
              ?.value ?? 0
          }
          onChange={(value) => {
            const selected = filterItems.find((item) => item.value === value);
            if (selected) onFilterChange(selected.label);
          }}
        />
      </>
    )}
  </div>
);

export default memo(SideBarMediaHeader);
