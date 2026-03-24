import type { User, Contact, Chat } from '@/types';
import type { SubTab } from '@/contexts/settings/types';

export interface SettingSearchItem {
  id: SubTab;
}

export type GlobalSearchItem =
  | { type: 'user'; data: User }
  | { type: 'contact'; data: Contact }
  | { type: 'group'; data: Chat }
  | { type: 'setting'; data: SettingSearchItem };
