import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@/contexts/languageCore';
import Button from '../ui/button/Button';
import { Icon } from '../Icons/AutoIcons';
import styles from './AppearanceMenu.module.scss';
import { useSettings } from '@/contexts/settings/context';
import { useTabs } from '@/components/Tabs/tabsShared';
import { useChatMeta } from '@/contexts/ChatContextCore';
import { useSortedChats } from '@/components/ChatList/useSortedChats';
import Avatar from '../Avatar/Avatar';
import type { Settings } from '@/contexts/settings/types';
import type { Chat } from '@/types';
import { ThemeLottieIcon } from './ThemeLottieIcons';

const tabs: Array<'chats' | 'appearance'> = ['chats', 'appearance'];

const THEME_OPTIONS: Array<Settings['theme']> = ['light', 'dark', 'system'];

const crossIcon = <Icon name='Cross' />;
const arrowLeftIcon = (
  <Icon
    name='Arrow'
    className={styles.arrowIcon}
    style={{ transform: 'rotate(180deg)' }}
  />
);
const arrowRightIcon = <Icon name='Arrow' className={styles.arrowIcon} />;

const AppearanceSwitchPrevContent = memo(function AppearanceSwitchPrevContent({
  label,
}: {
  label: string;
}) {
  return (
    <>
      {arrowLeftIcon}
      {label}
    </>
  );
});

const AppearanceSwitchNextContent = memo(function AppearanceSwitchNextContent({
  label,
}: {
  label: string;
}) {
  return (
    <>
      {label}
      {arrowRightIcon}
    </>
  );
});

const ThemeOptionButtonContent = memo(function ThemeOptionButtonContent({
  theme,
  active,
  label,
}: {
  theme: Settings['theme'];
  active: boolean;
  label: string;
}) {
  return (
    <span className={styles.themeButtonContent}>
      {theme === 'light' && (
        <ThemeLottieIcon variant='light' isActive={active} />
      )}
      {theme === 'dark' && <ThemeLottieIcon variant='dark' isActive={active} />}
      {theme === 'system' && (
        <Icon
          name='Appearance'
          className={styles.themeSystemIcon}
          aria-hidden
        />
      )}
      {label}
    </span>
  );
});

const ThemeOptionButton = memo(function ThemeOptionButton({
  theme,
  active,
  label,
  onSelect,
}: {
  theme: Settings['theme'];
  active: boolean;
  label: string;
  onSelect: (value: Settings['theme']) => void;
}) {
  const handleClick = useCallback(() => onSelect(theme), [onSelect, theme]);

  const buttonClass = `${styles.themeButton}${active ? ` ${styles.themeButtonActive}` : ''}`;

  return (
    <Button className={buttonClass} onClick={handleClick}>
      <ThemeOptionButtonContent theme={theme} active={active} label={label} />
    </Button>
  );
});

const ThemeButtonsRow = memo(function ThemeButtonsRow({
  selectedTheme,
  themeButtonLabels,
  onSetTheme,
}: {
  selectedTheme: Settings['theme'];
  themeButtonLabels: Record<Settings['theme'], string>;
  onSetTheme: (value: Settings['theme']) => void;
}) {
  return (
    <div className={styles.themeButtons}>
      {THEME_OPTIONS.map((opt) => (
        <ThemeOptionButton
          key={opt}
          theme={opt}
          active={selectedTheme === opt}
          label={themeButtonLabels[opt]}
          onSelect={onSetTheme}
        />
      ))}
    </div>
  );
});

const ThemePreviewSection = memo(function ThemePreviewSection({
  theme,
  onSelectLight,
  onSelectDark,
  labelLight,
  labelDark,
}: {
  theme: Settings['theme'];
  onSelectLight: () => void;
  onSelectDark: () => void;
  labelLight: string;
  labelDark: string;
}) {
  return (
    <div className={styles.themePreview}>
      <div className={styles.themePreviewItemWrapper}>
        <div
          onClick={onSelectLight}
          className={`${styles.themePreviewItem} ${theme === 'light' ? styles.themePreviewItemActive : ''}`}
        >
          <img
            src={
              new URL(
                '../../assets/Screenshots/themes/light.jpg',
                import.meta.url,
              ).href
            }
            alt='Theme Light'
          />
        </div>
        <span className={styles.themePreviewItemText}>{labelLight}</span>
      </div>
      <div className={styles.themePreviewItemWrapper}>
        <div
          onClick={onSelectDark}
          className={`${styles.themePreviewItem} ${theme === 'dark' ? styles.themePreviewItemActive : ''}`}
        >
          <img
            src={
              new URL(
                '../../assets/Screenshots/themes/dark.jpg',
                import.meta.url,
              ).href
            }
            alt='Theme Dark'
          />
        </div>
        <span className={styles.themePreviewItemText}>{labelDark}</span>
      </div>
    </div>
  );
});

const AppearanceAppearanceTab = memo(function AppearanceAppearanceTab({
  theme,
  onSetTheme,
  onOpenSettings,
  appearanceTitle,
  themeButtonLabels,
  previewLabelLight,
  previewLabelDark,
  openSettingsLabel,
  onSelectLight,
  onSelectDark,
}: {
  theme: Settings['theme'];
  onSetTheme: (value: Settings['theme']) => void;
  onOpenSettings: () => void;
  appearanceTitle: string;
  themeButtonLabels: Record<Settings['theme'], string>;
  previewLabelLight: string;
  previewLabelDark: string;
  openSettingsLabel: string;
  onSelectLight: () => void;
  onSelectDark: () => void;
}) {
  return (
    <>
      <div className={styles.header}>{appearanceTitle}</div>
      <div className={styles.themeSection}>
        <ThemeButtonsRow
          selectedTheme={theme}
          themeButtonLabels={themeButtonLabels}
          onSetTheme={onSetTheme}
        />
        <ThemePreviewSection
          theme={theme}
          onSelectLight={onSelectLight}
          onSelectDark={onSelectDark}
          labelLight={previewLabelLight}
          labelDark={previewLabelDark}
        />
      </div>
      <button
        type='button'
        className={styles.appearanceLink}
        onClick={onOpenSettings}
      >
        {openSettingsLabel}
      </button>
    </>
  );
});

const RecentChatTile = memo(function RecentChatTile({
  chat,
  fallbackName,
  onOpen,
}: {
  chat: Chat;
  fallbackName: string;
  onOpen: (id: number) => void;
}) {
  const handleClick = useCallback(() => onOpen(chat.id), [onOpen, chat.id]);

  return (
    <button type='button' className={styles.chatGridItem} onClick={handleClick}>
      <Avatar
        displayName={chat.name || ''}
        displayMedia={chat.primary_media}
        className={styles.chatGridAvatar}
      />
      <span className={styles.chatGridName} title={chat.name || ''}>
        {chat.name || fallbackName}
      </span>
    </button>
  );
});

const AppearanceChatsTab = memo(function AppearanceChatsTab({
  chatsTitle,
  recentChats,
  chatFallbackName,
  onChatClick,
}: {
  chatsTitle: string;
  recentChats: Chat[];
  chatFallbackName: string;
  onChatClick: (id: number) => void;
}) {
  return (
    <>
      <div className={styles.header}>{chatsTitle}</div>
      <div className={styles.chatsGrid}>
        {recentChats.map((chat) => (
          <RecentChatTile
            key={chat.id}
            chat={chat}
            fallbackName={chatFallbackName}
            onOpen={onChatClick}
          />
        ))}
      </div>
    </>
  );
});

const AppearancePageSwitch = memo(function AppearancePageSwitch({
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
}: {
  onPrev: () => void;
  onNext: () => void;
  prevLabel: string;
  nextLabel: string;
}) {
  return (
    <div className={styles.pageSwitch}>
      <Button
        key='appearance-menu-previous-button'
        className={styles.switchButton}
        onClick={onPrev}
      >
        <AppearanceSwitchPrevContent label={prevLabel} />
      </Button>
      <Button
        key='appearance-menu-next-button'
        className={styles.switchButton}
        onClick={onNext}
      >
        <AppearanceSwitchNextContent label={nextLabel} />
      </Button>
    </div>
  );
});

const AppearanceMenuInner: React.FC = () => {
  const { t } = useTranslation();
  const { settings, setSetting, setActiveProfileTab } = useSettings();
  const { setActiveTab } = useTabs();
  const { chats, handleChatClick } = useChatMeta();
  const sortedChats = useSortedChats(chats);
  const recentChats = useMemo(() => sortedChats.slice(0, 6), [sortedChats]);

  const [visible, setVisible] = useState(true);
  const [activeTab, setActiveTabState] = useState<'chats' | 'appearance'>(
    'appearance',
  );

  const handleNextTab = useCallback(() => {
    setActiveTabState((current) => {
      const currentIndex = tabs.indexOf(current);
      const nextIndex = (currentIndex + 1) % tabs.length;
      return tabs[nextIndex];
    });
  }, []);

  const handlePrevTab = useCallback(() => {
    setActiveTabState((current) => {
      const currentIndex = tabs.indexOf(current);
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      return tabs[prevIndex];
    });
  }, []);

  const handleOpenAppearanceSettings = useCallback(() => {
    setActiveProfileTab('appearance');
    setActiveTab('profile');
  }, [setActiveProfileTab, setActiveTab]);

  const setTheme = useCallback(
    (value: Settings['theme']) => setSetting('theme', value),
    [setSetting],
  );

  const onSelectLight = useCallback(
    () => setSetting('theme', 'light'),
    [setSetting],
  );

  const onSelectDark = useCallback(
    () => setSetting('theme', 'dark'),
    [setSetting],
  );

  const toggleTipsVisible = useCallback(() => {
    setVisible((v) => !v);
  }, []);

  const themeButtonLabels = useMemo(
    () =>
      ({
        light: t('tipsMenu.themeLight'),
        dark: t('tipsMenu.themeDark'),
        system: t('tipsMenu.themeSystem'),
      }) as Record<Settings['theme'], string>,
    [t],
  );

  const appearanceTitle = t('tipsMenu.appearance');
  const previewLabelLight = t('tipsMenu.themeLight');
  const previewLabelDark = t('tipsMenu.themeDark');
  const openSettingsLabel = t('tipsMenu.openAppearanceSettings');
  const chatsTitle = t('tipsMenu.chats');
  const chatFallbackName = t('chat.chat');
  const prevTipLabel = t('tipsMenu.previousTip');
  const nextTipLabel = t('tipsMenu.nextTip');
  const selectToStart = t('chat.selectToStart');

  return (
    <div className={styles.container}>
      <Button className={styles.menuSwitch} onClick={toggleTipsVisible}>
        {visible ? crossIcon : '?'}
      </Button>
      <div className={styles.menuLayer}>
        <div
          className={`${styles.tipsMenu} ${!visible ? styles.tipsMenuHidden : ''}`}
        >
          <div className={styles.mainContentWrapper}>
            <div
              className={`${styles.mainContent} ${styles.tabPanel} ${
                activeTab === 'appearance' ? styles.tabPanelActive : ''
              }`}
            >
              <AppearanceAppearanceTab
                theme={settings.theme}
                onSetTheme={setTheme}
                onOpenSettings={handleOpenAppearanceSettings}
                appearanceTitle={appearanceTitle}
                themeButtonLabels={themeButtonLabels}
                previewLabelLight={previewLabelLight}
                previewLabelDark={previewLabelDark}
                openSettingsLabel={openSettingsLabel}
                onSelectLight={onSelectLight}
                onSelectDark={onSelectDark}
              />
            </div>
            <div
              className={`${styles.mainContent} ${styles.tabPanel} ${
                activeTab === 'chats' ? styles.tabPanelActive : ''
              }`}
            >
              <AppearanceChatsTab
                chatsTitle={chatsTitle}
                recentChats={recentChats}
                chatFallbackName={chatFallbackName}
                onChatClick={handleChatClick}
              />
            </div>
          </div>
          <AppearancePageSwitch
            onPrev={handlePrevTab}
            onNext={handleNextTab}
            prevLabel={prevTipLabel}
            nextLabel={nextTipLabel}
          />
        </div>
        <div
          className={`${styles.noChatHintWrap} ${!visible ? styles.noChatHintWrapVisible : ''}`}
        >
          <div className={styles.noChatText}>{selectToStart}</div>
        </div>
      </div>
    </div>
  );
};

const AppearanceMenu = memo(AppearanceMenuInner);

export default AppearanceMenu;
