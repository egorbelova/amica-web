export interface File {
  id: number;
  width?: number;
  height?: number;
  file_url: string;
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
}

export interface Message {
  id: number;
  value: string;
  date: string;
  user: number;
  viewers: number[];
  liked: number;
  files: File[];
  is_own: boolean;
}

export interface Chat {
  id: number;
  name: string | null;
  members: User[];
  type: 'D' | 'G' | 'C';
  primary_media: DisplayMedia | null;
  last_message: Message | null;
  unread_count: number;
  info: string;
}

export interface PhotoMedia {
  type: 'photo';
  small: string;
  medium?: string;
}

export interface VideoMedia {
  type: 'video';
  url: string;
  duration?: number | null;
}

export interface MediaLayer {
  id: number;
  media: DisplayMedia | null;
}

export type DisplayMedia = PhotoMedia | VideoMedia;

export interface UserProfile {
  id: number;
  last_seen: string | null;
  bio: string | null;
  phone: string | null;
  date_of_birth: string | null;
  location: string | null;
  primary_avatar: any | null;
  media: any[];
}

export interface User {
  id: number;
  email: string;
  username: string;
  profile: UserProfile;
  preferred_session_lifetime_days: number;
  active_wallpaper?: any | null;
  last_seen: string | null;
  is_contact?: boolean;
  contact_id?: number;
}

export interface Contact {
  id: number;
  username: string;
  profile: UserProfile;
  primary_avatar: any | null;
}
