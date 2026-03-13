import type { User } from '@/types';
import type { Contact } from '@/types';
import type { SubTab } from '@/contexts/settings/types';

export interface SettingSearchItem {
  id: SubTab;
}

export type GlobalSearchItem =
  | { type: 'user'; data: User }
  | { type: 'contact'; data: Contact }
  | { type: 'setting'; data: SettingSearchItem };
