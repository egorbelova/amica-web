import { useMemo, useState, useEffect, startTransition } from 'react';
import type { Message, File } from '@/types';
import type { DropdownItem } from '@/components/Dropdown/Dropdown';
import type { IconName } from '@/components/Icons/AutoIcons';

export type SideBarTab = 'members' | 'media' | 'audio';

export function useSideBarMediaData(
  messages: Message[] | undefined,
  chatType: 'D' | 'G' | 'C',
  chatId: number | undefined,
) {
  const mediaFiles = useMemo(
    () =>
      messages
        ?.flatMap((msg) => msg.files || [])
        .filter((f: File) => f.category === 'image' || f.category === 'video')
        .reverse() || [],
    [messages],
  );

  const audioFiles = useMemo(
    () =>
      messages
        ?.flatMap((msg) => msg.files || [])
        .filter((f: File) => f.category === 'audio')
        .reverse() || [],
    [messages],
  );

  const [filterType, setFilterType] = useState<string>('All');
  const hasVideos = useMemo(
    () => mediaFiles.some((f) => f.category === 'video'),
    [mediaFiles],
  );
  const hasPhotos = useMemo(
    () => mediaFiles.some((f) => f.category === 'image'),
    [mediaFiles],
  );

  const filterItems = useMemo((): DropdownItem<number>[] => {
    const items: (DropdownItem<number> | null)[] = [
      { label: 'All', value: 1, icon: 'Circle' as IconName },
      hasVideos
        ? { label: 'Videos', value: 2, icon: 'Video' as IconName }
        : null,
      hasPhotos
        ? { label: 'Photos', value: 3, icon: 'Photo' as IconName }
        : null,
    ].filter(Boolean);
    return items as DropdownItem<number>[];
  }, [hasVideos, hasPhotos]);

  const effectiveFilterType = useMemo(() => {
    if (
      (filterType === 'Videos' && !hasVideos) ||
      (filterType === 'Photos' && !hasPhotos)
    )
      return 'All';
    return filterType;
  }, [filterType, hasVideos, hasPhotos]);

  const filteredMediaFiles = useMemo(
    () =>
      mediaFiles.filter(
        (f: File) =>
          (f.category === 'image' &&
            (effectiveFilterType === 'Photos' ||
              effectiveFilterType === 'All')) ||
          (f.category === 'video' &&
            (effectiveFilterType === 'Videos' ||
              effectiveFilterType === 'All')),
      ),
    [mediaFiles, effectiveFilterType],
  );

  const availableTabs = useMemo((): SideBarTab[] => {
    const tabs: SideBarTab[] = [];
    if (chatType === 'G') tabs.push('members');
    if (mediaFiles.length > 0) tabs.push('media');
    if (audioFiles.length > 0) tabs.push('audio');
    return tabs;
  }, [chatType, mediaFiles.length, audioFiles.length]);

  const [userSelectedTab, setActiveTab] = useState<SideBarTab | null>(null);

  useEffect(() => {
    if (chatId !== undefined) startTransition(() => setActiveTab(null));
  }, [chatId]);

  const activeTab = useMemo(() => {
    if (userSelectedTab && availableTabs.includes(userSelectedTab))
      return userSelectedTab;
    return availableTabs[0] || null;
  }, [userSelectedTab, availableTabs]);

  return {
    mediaFiles,
    audioFiles,
    filterType,
    setFilterType,
    filterItems,
    effectiveFilterType,
    filteredMediaFiles,
    availableTabs,
    activeTab,
    setActiveTab,
  };
}
