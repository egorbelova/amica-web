import React, {
  useRef,
  useLayoutEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '@/contexts/languageCore';
import styles from './ContextMenu.module.scss';

export interface ReactionItem {
  type: string;
  emoji: string;
  iconUrl?: string;
  webmUrl: string;
  movUrl: string;
}

const MENU_GROUP_ATTR = 'data-menu-group';

interface ReactionsPanelProps {
  reactions: readonly ReactionItem[];
  selectedReactionTypes?: readonly string[];
  onReactionSelect?: (reactionType: string) => void;
  /** Required. Panel attaches to menu top-left (no fallback to click point) */
  menuRect: DOMRect;
  visible?: boolean;
  isHiding?: boolean;
  /** When set, included in menu group for click-outside (e.g. message-context-123) */
  menuGroupId?: string;
  /** Called when hide transition completes */
  onAnimationEnd?: () => void;
}

export const ReactionsPanel = forwardRef<
  HTMLDivElement | null,
  ReactionsPanelProps
>(function ReactionsPanel(
  {
    reactions,
    selectedReactionTypes = [],
    onReactionSelect,
    menuRect,
    visible = true,
    isHiding = false,
    menuGroupId,
    onAnimationEnd,
  },
  ref,
) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => panelRef.current);
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    if (reactions.length === 0) return;

    const panel = panelRef.current;
    if (!panel) return;

    const gap = 12;
    const panelHeight = panel.offsetHeight;
    const panelWidth = panel.offsetWidth;
    const minX = 10;
    const maxX = window.innerWidth - panelWidth - 10;

    const left = Math.max(minX, Math.min(menuRect.left, maxX));
    let top = menuRect.top - panelHeight - gap;
    if (top < 10) top = 10;

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }, [menuRect.left, menuRect.top, reactions.length]);

  useLayoutEffect(() => {
    const frameId = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frameId);
  }, []);

  if (reactions.length === 0) return null;

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    if (e.target !== e.currentTarget || !isHiding) return;
    onAnimationEnd?.();
  };

  return createPortal(
    <div
      ref={panelRef}
      className={`${styles['reaction-panel']} ${
        mounted && visible ? styles['reaction-panel--visible'] : ''
      } ${isHiding ? styles['reaction-panel--hiding'] : ''}`}
      onTransitionEnd={handleTransitionEnd}
      {...(menuGroupId && { [MENU_GROUP_ATTR]: menuGroupId })}
    >
      <div className={styles['reaction-panel__content']}>
        {reactions.map((reaction, index) => (
          <button
            key={reaction.type}
            type='button'
            className={`${styles['reaction-panel__item']} ${
              selectedReactionTypes.includes(reaction.type)
                ? styles['reaction-panel__item--selected']
                : ''
            }`}
            style={{ animationDelay: `${index * 55}ms` }}
            onClick={() => onReactionSelect?.(reaction.type)}
            aria-label={`${t('aria.reactWith')} ${reaction.emoji}`}
          >
            {reaction.iconUrl ? (
              <img
                src={reaction.iconUrl}
                alt=''
                className={styles['reaction-panel__icon']}
              />
            ) : (
              <span className={styles['reaction-panel__emoji']}>
                {reaction.emoji}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className={styles['reaction-panel__thoughts']} aria-hidden='true'>
        <span className={styles['reaction-panel__thought-bubble']} />
        <span
          className={`${styles['reaction-panel__thought-bubble']} ${styles['reaction-panel__thought-bubble--small']}`}
        />
      </div>
    </div>,
    document.body,
  );
});
