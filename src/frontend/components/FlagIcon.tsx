/**
 * FlagIcon — renders a country flag as inline SVG via `country-flag-icons`.
 *
 * Replaces the Unicode flag-emoji approach in places where the flag really
 * matters as identification. The Unicode emoji (`🇺🇸`) renders correctly on
 * macOS/iOS/Linux but falls back to bare regional-indicator letters on
 * Windows (e.g. "US"), which next to an explicit ISO3 label reads as the
 * country name twice.
 *
 * Tree-shakes to just the 10 slice countries; total payload ≈ 5 KB.
 */

import type { ComponentType, SVGProps } from 'react';
import AU from 'country-flag-icons/react/3x2/AU';
import CN from 'country-flag-icons/react/3x2/CN';
import IN from 'country-flag-icons/react/3x2/IN';
import JP from 'country-flag-icons/react/3x2/JP';
import KP from 'country-flag-icons/react/3x2/KP';
import KR from 'country-flag-icons/react/3x2/KR';
import PH from 'country-flag-icons/react/3x2/PH';
import RU from 'country-flag-icons/react/3x2/RU';
import TW from 'country-flag-icons/react/3x2/TW';
import US from 'country-flag-icons/react/3x2/US';
import { ISO3_TO_ISO2, getCountryName } from '@/lib/geo';

type FlagComponent = ComponentType<SVGProps<SVGSVGElement> & { title?: string }>;

/** Map of ISO-2 codes → SVG component. Only the 10 slice countries. */
const FLAG_COMPONENTS: Record<string, FlagComponent> = {
  AU, CN, IN, JP, KP, KR, PH, RU, TW, US,
};

export interface FlagIconProps {
  /** ISO-3 country code, e.g. "USA". */
  iso3: string;
  /**
   * Tailwind class string controlling size + visual treatment. Defaults to
   * a clean rectangle. Override per call site (the AgentDrawer header wants
   * something larger than a decision-log row, for example).
   */
  className?: string;
  /** Optional accessible title; defaults to the full country name. */
  title?: string;
}

export function FlagIcon({
  iso3,
  // TODO(user): pick the default visual treatment for the demo. The active
  // line is what every call site gets unless it overrides `className`.
  // Pick ONE — the others are kept as comments for easy A/B swapping:
  //
  //   1. Clean rectangle (utilitarian, most-recognizable)
  //      "w-5 h-3.5 shrink-0"
  //
  //   2. Rounded rectangle (modern UI badge feel)
  //      "w-5 h-3.5 rounded-sm shrink-0"
  //
  //   3. Bordered chip (looks like a HUD element, matches the cyber aesthetic)
  //      "w-5 h-3.5 ring-1 ring-outline-variant/40 shrink-0"
  //
  //   4. Circular crop (smallest visual footprint; loses some flag identity)
  //      "w-4 h-4 rounded-full object-cover shrink-0"
  className = 'w-5 h-3.5 ring-1 ring-outline-variant/40 shrink-0',
  title,
}: FlagIconProps) {
  const iso2 = ISO3_TO_ISO2[iso3];
  const Cmp = iso2 ? FLAG_COMPONENTS[iso2] : undefined;
  if (!Cmp) {
    // Unknown country — fall back to a small placeholder so layouts don't shift.
    return (
      <span
        className={[className, 'inline-block bg-outline-variant/30'].join(' ')}
        aria-label={iso3}
        title={title ?? iso3}
      />
    );
  }
  return <Cmp className={className} title={title ?? getCountryName(iso3)} />;
}
