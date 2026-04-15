/**
 * Country ISO-3 → geographic centroid (lat, lon) lookup.
 * Seeded for the 10 vertical-slice countries.
 */

export interface LatLon {
  lat: number;
  lon: number;
}

/** Geographic centroids for the 10 scenario countries. */
export const COUNTRY_CENTROIDS: Record<string, LatLon> = {
  CHN: { lat: 35.8617, lon: 104.1954 },
  TWN: { lat: 23.6978, lon: 120.9605 },
  USA: { lat: 37.0902, lon: -95.7129 },
  JPN: { lat: 36.2048, lon: 138.2529 },
  KOR: { lat: 35.9078, lon: 127.7669 },
  PHL: { lat: 12.8797, lon: 121.774 },
  AUS: { lat: -25.2744, lon: 133.7751 },
  PRK: { lat: 40.3399, lon: 127.5101 },
  RUS: { lat: 61.524, lon: 105.3188 },
  IND: { lat: 20.5937, lon: 78.9629 },
};

/** Returns the centroid for a given ISO-3 code, or null if not found. */
export function getCentroid(iso3: string): LatLon | null {
  return COUNTRY_CENTROIDS[iso3] ?? null;
}

/** Flag emoji for ISO-3 country codes. */
export const COUNTRY_FLAGS: Record<string, string> = {
  CHN: '🇨🇳',
  TWN: '🇹🇼',
  USA: '🇺🇸',
  JPN: '🇯🇵',
  KOR: '🇰🇷',
  PHL: '🇵🇭',
  AUS: '🇦🇺',
  PRK: '🇰🇵',
  RUS: '🇷🇺',
  IND: '🇮🇳',
};

export function getFlag(iso3: string): string {
  return COUNTRY_FLAGS[iso3] ?? '🏴';
}

/** Full display names for the 10 countries. */
export const COUNTRY_NAMES: Record<string, string> = {
  CHN: 'China',
  TWN: 'Taiwan',
  USA: 'United States',
  JPN: 'Japan',
  KOR: 'South Korea',
  PHL: 'Philippines',
  AUS: 'Australia',
  PRK: 'North Korea',
  RUS: 'Russia',
  IND: 'India',
};

export function getCountryName(iso3: string): string {
  return COUNTRY_NAMES[iso3] ?? iso3;
}
