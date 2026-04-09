import { Icon } from '../Icons/AutoIcons';
import styles from './Profile.module.scss';
import { useTranslation } from '@/contexts/languageCore';
import { useSettings } from '@/contexts/settings/context';
import type { SubTab } from '@/contexts/settings/types';
import Button from '@/components/ui/button/Button';
import sidebarMediaStyles from '@/components/SideBarMedia/SideBarMedia.module.scss';
import {
  useProfileAccountSaveRegistration,
} from './ProfileAccountSaveContext';

/** Edit / Save for account username (same provider tree as `ProfileAccount`). */
export function ProfileAccountSaveHeaderButton({
  className,
}: {
  className?: string;
}) {
  const { t } = useTranslation();
  const reg = useProfileAccountSaveRegistration();
  if (!reg) return null;
  return (
    <Button
      type='button'
      className={[sidebarMediaStyles.button, className].filter(Boolean).join(' ')}
      disabled={reg.primaryDisabled}
      onClick={() => reg.onPrimaryAction()}
    >
      {reg.usernameEditing ? t('buttons.save') : t('buttons.edit')}
    </Button>
  );
}

const arrowBackIcon = (
  <Icon name='Arrow' style={{ transform: 'rotate(180deg)' }} />
);
const fullscreenIcon = <Icon name='Fullscreen' />;

type ProfileSubpageHeaderProps = {
  tabId: NonNullable<SubTab>;
  onBack: () => void;
};

export default function ProfileSubpageHeader({
  tabId,
  onBack,
}: ProfileSubpageHeaderProps) {
  const { t } = useTranslation();
  const {
    isResizingPermitted,
    settingsFullWindow,
    setSettingsFullWindow,
  } = useSettings();
  const accountReg = useProfileAccountSaveRegistration();

  const handleBackClick = () => {
    if (tabId === 'account' && accountReg?.usernameEditing) {
      accountReg.discardUsernameEdit();
      return;
    }
    onBack();
  };

  return (
    <div className={styles.pageHeader}>
      <Button
        key={`header-back-${tabId}`}
        onClick={handleBackClick}
        className={styles.close}
      >
        {arrowBackIcon}
      </Button>
      <span className={styles.pageHeaderTitle}>
        {t(`profileTabs.${tabId}`)}
      </span>
      <div className={styles.pageHeaderTrailing}>
        {isResizingPermitted && !settingsFullWindow ? (
          <Button
            key={`header-maximize-${tabId}`}
            className={styles.maximize}
            onClick={() => setSettingsFullWindow(true)}
          >
            {fullscreenIcon}
          </Button>
        ) : (
          <span className={styles.pageHeaderSpacer} aria-hidden />
        )}
        {tabId === 'account' && <ProfileAccountSaveHeaderButton />}
      </div>
    </div>
  );
}
