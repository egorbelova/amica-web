import type { WallpaperSetting } from '@/contexts/settings/types';

export interface File {
  id?: number;
  width?: number;
  height?: number;
  file_url?: string;
  file_type?: string;
  original_name?: string;
  category?: string;
  has_audio?: boolean;
  thumbnail_small_url?: string;
  thumbnail_medium_url?: string;
  dominant_color?: string;
  duration?: number;
  waveform?: number[];
  cover_url?: string;
  file_size?: number;
  extension?: string;
}

export interface Message {
  id: number;
  value: string;
  edit_date: string | null;
  date: string;
  user: number;
  viewers?: User[];
  liked: number;
  files: File[];
  is_own: boolean;
  is_viewed: boolean;
  is_deleted?: boolean;
}

export interface Chat {
  id: number;
  name: string | null;
  members: User[];
  type: 'D' | 'G' | 'C';
  primary_media: DisplayMedia;
  last_message: Message | null;
  unread_count: number;
  info: string;
  media: DisplayMedia[];
}

export interface MediaLayer {
  id: string;
  media: DisplayMedia | null;
}

interface BaseMedia {
  id: string | number;
  createdAt?: Date;
}

export interface PhotoMedia extends BaseMedia {
  type: 'photo';
  small?: string;
  medium?: string;
}

export interface VideoMedia extends BaseMedia {
  type: 'video';
  url: string;
  duration?: number | null;
}

export type DisplayMedia = PhotoMedia | VideoMedia;

export interface UserProfile {
  id: number;
  last_seen: string | null;
  bio: string | null;
  phone: string | null;
  date_of_birth: string | null;
  location: string | null;
  primary_media: DisplayMedia;
  media: DisplayMedia[];
}

export interface User {
  id: number;
  email: string;
  username: string;
  profile: UserProfile;
  preferred_session_lifetime_days: number;
  active_wallpaper?: WallpaperSetting | null;
  last_seen: string | null;
  is_contact?: boolean;
  contact_id?: number;
}

export interface Contact {
  id: number;
  username: string;
  profile: UserProfile;
  primary_media: DisplayMedia | null;
  name: string;
  email?: string;
  phone?: string;
  chat_id: number;
  last_seen: string | null;
}

export interface Session {
  jti: string;
  ip_address: string;
  device: string;
  user_agent: string;
  created_at: string;
  expires_at: string;
  last_active: string;
  is_current: boolean;
  city: string | null;
  country: string | null;
}
