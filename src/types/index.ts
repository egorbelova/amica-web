export interface File {
  id: number;
  file_url: string;
  file_type?: string;
  original_name?: string;
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
  primary_media: string | null;
  last_message: Message | null;
  unread_count: number;
}

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
}
