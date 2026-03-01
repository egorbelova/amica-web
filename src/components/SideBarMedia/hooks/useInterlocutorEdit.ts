import { useState, useCallback, useLayoutEffect, useRef } from 'react';

const TRIM_REG = /[\u200B-\u200D\uFEFF]/g;

export function useInterlocutorEdit(chatId: string, defaultName: string) {
  const [nameDraftByChatId, setNameDraftByChatId] = useState<
    Record<string, string>
  >({});
  const [interlocutorEditVisible, setInterlocutorEditVisible] = useState(false);
  const prevEditVisibleRef = useRef(false);
  const nameEditRef = useRef<HTMLDivElement>(null);

  const editValue = nameDraftByChatId[chatId] ?? defaultName;
  const setValue = useCallback(
    (nextValue: string) => {
      if (!chatId) return;
      const normalized = nextValue.replace(TRIM_REG, '');
      setNameDraftByChatId((prev) => ({ ...prev, [chatId]: normalized }));
    },
    [chatId],
  );

  const effectiveNameLength = editValue.replace(TRIM_REG, '').trim().length;
  const visibleName = interlocutorEditVisible ? editValue : defaultName;

  useLayoutEffect(() => {
    const justOpened = interlocutorEditVisible && !prevEditVisibleRef.current;
    prevEditVisibleRef.current = interlocutorEditVisible;
    if (!interlocutorEditVisible || !nameEditRef.current) return;
    const isFocusedOnName = document.activeElement === nameEditRef.current;
    if (justOpened || !isFocusedOnName) {
      const normalized = editValue.replace(TRIM_REG, '') || '\u200B';
      nameEditRef.current.innerText = normalized;
    }
  }, [interlocutorEditVisible, editValue]);

  const onInterlocutorEditBack = useCallback(
    () => setInterlocutorEditVisible(false),
    [],
  );
  const onInterlocutorEdit = useCallback(() => {
    if (chatId) {
      setNameDraftByChatId((prev) => ({
        ...prev,
        [chatId]: prev[chatId] ?? defaultName,
      }));
    }
    setInterlocutorEditVisible(true);
  }, [chatId, defaultName]);

  const handleNameEditInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      const el = e.target as HTMLDivElement;
      const raw = el.innerText.replace(/\r?\n/g, ' ');
      const text = raw.replace(TRIM_REG, '');
      setValue(text);
      const displayContent = text || '\u200B';
      if (el.innerText !== displayContent) {
        el.innerText = displayContent;
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(el);
        range.collapse(displayContent === '\u200B');
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    },
    [setValue],
  );

  const handleNameEditBeforeInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      const ie = e.nativeEvent as InputEvent;
      if (ie.inputType === 'insertText' && ie.data === '. ') {
        e.preventDefault();
        document.execCommand('insertText', false, '  ');
      }
    },
    [],
  );

  const handleNameEditKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter') e.preventDefault();
    },
    [],
  );

  return {
    nameEditRef,
    editValue,
    setValue,
    effectiveNameLength,
    visibleName,
    interlocutorEditVisible,
    setInterlocutorEditVisible,
    onInterlocutorEditBack,
    onInterlocutorEdit,
    handleNameEditInput,
    handleNameEditBeforeInput,
    handleNameEditKeyDown,
  };
}
