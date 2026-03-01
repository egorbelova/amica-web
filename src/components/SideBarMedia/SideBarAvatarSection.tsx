import React, { memo } from 'react';
import EditableAvatar from '@/components/Avatar/EditableAvatar';
import Avatar from '@/components/Avatar/Avatar';
import type { DisplayMedia } from '@/types';
import styles from './SideBarMedia.module.scss';

interface SideBarAvatarSectionProps {
  chatId: number;
  chatName: string;
  primaryMedia: DisplayMedia | null | undefined;
  media: DisplayMedia[] | undefined;
  interlocutorContactId: number | undefined;
  isAvatarRollerOpen: boolean;
  interlocutorEditVisible: boolean;
  effectiveRollPosition: number;
  onRollPositionChange: () => void;
  onAvatarRollerOpen: () => void;
}

const SideBarAvatarSection: React.FC<SideBarAvatarSectionProps> = ({
  chatId,
  chatName,
  primaryMedia,
  media,
  interlocutorContactId,
  isAvatarRollerOpen,
  interlocutorEditVisible,
  effectiveRollPosition,
  onRollPositionChange,
  onAvatarRollerOpen,
}) => (
  <div
    className={`${styles['sidebar__avatar-container']} ${
      isAvatarRollerOpen && !interlocutorEditVisible
        ? styles['sidebar__avatar-container--roller']
        : ''
    }`}
  >
    <div
      className={`${styles['sidebar__avatar-wrapper']} ${
        interlocutorEditVisible ? styles['sidebar__avatar-wrapper--edit'] : ''
      } ${
        isAvatarRollerOpen && !interlocutorEditVisible
          ? styles['sidebar__avatar-wrapper--roller']
          : ''
      }`}
      style={{
        transform: `translateX(${effectiveRollPosition * -100}%)`,
      }}
      onClick={onRollPositionChange}
    >
      <EditableAvatar
        key={chatId}
        displayName={chatName}
        avatar={primaryMedia}
        objectId={interlocutorContactId}
        contentType="contact"
        className={styles['sidebar__avatar']}
        classNameAvatar={styles['sidebar__editable-avatar']}
        isAvatarRollerOpen={isAvatarRollerOpen}
        onClick={
          primaryMedia && !interlocutorEditVisible
            ? onAvatarRollerOpen
            : undefined
        }
        onAvatarChange={() => {}}
        isEditable={interlocutorEditVisible}
      />
      {media && media.length > 0 && (
        <>
          {media.map((m: DisplayMedia) => (
            <Avatar
              key={m.id}
              displayName={chatName}
              displayMedia={m as DisplayMedia}
              size={isAvatarRollerOpen ? 'medium' : 'small'}
              className={`${styles['sidebar__avatar']} ${
                isAvatarRollerOpen && !interlocutorEditVisible
                  ? ''
                  : styles.hidden
              }`}
            />
          ))}
        </>
      )}
    </div>
  </div>
);

export default memo(SideBarAvatarSection);
