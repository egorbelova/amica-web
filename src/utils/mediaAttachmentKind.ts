import type { File } from '@/types';

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|mkv|avi|mpeg|flv|3gp|3g2)$/i;
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|heic|heif|bmp|avif|apng)$/i;

/** True when the attachment should render as video (category or MIME/name fallback). */
export function isLikelyVideoFile(f: File): boolean {
  if (f.category === 'video') return true;
  const ft = (f.file_type || '').toLowerCase();
  if (ft.startsWith('video/')) return true;
  return VIDEO_EXT.test(f.original_name || '');
}

/** True when the attachment should render as image (category or MIME/name fallback). */
export function isLikelyImageFile(f: File): boolean {
  if (f.category === 'image') return true;
  const ft = (f.file_type || '').toLowerCase();
  if (ft.startsWith('image/')) return true;
  return IMAGE_EXT.test(f.original_name || '');
}

/** Non-audio / non-document grid items; includes misclassified `other` image/video files. */
export function isMediaGridAttachmentFile(f: File): boolean {
  if (f.category === 'audio') return false;
  if (f.category === 'document') return false;
  if (f.category === 'other')
    return isLikelyVideoFile(f) || isLikelyImageFile(f);
  return true;
}
