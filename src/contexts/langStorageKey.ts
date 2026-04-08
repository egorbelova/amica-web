/** localStorage key for UI locale; per-user when logged in. */
export function getLangStorageKey(userId: number | null | undefined): string {
  return userId != null ? `app-lang-${userId}` : 'app-lang';
}
