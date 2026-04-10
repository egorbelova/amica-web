import type { Session } from '@/types';

/**
 * Uses server-built device label ("Browser on OS") when unambiguous, else UA heuristics.
 */
function isPcFromDeviceLabel(device: string): boolean | null {
  const d = device.trim();
  if (!d) return null;
  if (/ on (iphone|ipad|ipod|android|ios)\b/i.test(d)) return false;
  if (/ on (windows|mac|linux|chrome os|cros)\b/i.test(d)) return true;
  return null;
}

function isPcFromUserAgent(ua: string): boolean {
  const u = ua.trim();
  if (!u) return true;
  const lower = u.toLowerCase();
  if (lower.includes('android')) return false;
  if (lower.includes('iphone') || lower.includes('ipod')) return false;
  if (lower.includes('ipad')) return false;
  if (lower.includes('webos')) return false;
  if (lower.includes('blackberry')) return false;
  if (lower.includes('windows phone')) return false;
  if (/macintosh/i.test(lower) && /mobile/i.test(lower)) return false;
  if (/windows nt|macintosh|mac os x|x11|linux|cros/i.test(lower)) return true;
  return !/mobile|tablet|phone/i.test(lower);
}

/** True = desktop/laptop (pc.webp); false = phone/tablet (phone.webp). */
export function isPcSessionFormFactor(
  session: Pick<Session, 'user_agent' | 'device'>,
): boolean {
  const fromLabel = isPcFromDeviceLabel(session.device || '');
  if (fromLabel !== null) return fromLabel;
  return isPcFromUserAgent(session.user_agent || '');
}
