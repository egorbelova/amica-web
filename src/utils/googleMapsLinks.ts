/** Text query for Maps search / embed (city+country preferred over raw IP). */
export function trustedDeviceMapsQuery(
  requestCity?: string,
  requestCountry?: string,
  requestIp?: string,
): string | null {
  const loc = [requestCity, requestCountry]
    .map((s) => (s || '').trim())
    .filter(Boolean)
    .join(', ');
  if (loc) return loc;
  const ip = (requestIp || '').trim();
  return ip || null;
}

export function googleMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Embed without API key; opens a search result map for the query. */
export function googleMapsEmbedUrl(query: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}
