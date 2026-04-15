/**
 * Domain → color + label helpers.
 * Colors match DESIGN.md exactly and the architecture.md arc color table.
 */

import type { Domain } from '@/lib/types/sim-event';

export interface DomainMeta {
  /** Tailwind color class prefix (used as text-{key}, bg-{key}/10, etc.) */
  colorClass: string;
  /** Raw hex for Deck.gl layers (no Tailwind processing at runtime). */
  hex: string;
  /** RGBA array for Deck.gl [r, g, b, a]. */
  rgba: [number, number, number, number];
  /** Human-readable label. */
  label: string;
}

export const DOMAIN_META: Record<Domain, DomainMeta> = {
  info: {
    colorClass: 'info',
    hex: '#a78bfa',
    rgba: [167, 139, 250, 220],
    label: 'INFO',
  },
  diplomatic: {
    // Per DESIGN.md, diplomatic is grouped with info (violet)
    colorClass: 'info',
    hex: '#a78bfa',
    rgba: [167, 139, 250, 220],
    label: 'DIPLOMATIC',
  },
  economic: {
    colorClass: 'economic',
    hex: '#f5a623',
    rgba: [245, 166, 35, 220],
    label: 'ECONOMIC',
  },
  cyber: {
    colorClass: 'cyber',
    hex: '#5bc9ff',
    rgba: [91, 201, 255, 220],
    label: 'CYBER',
  },
  kinetic_limited: {
    colorClass: 'kinetic',
    hex: '#ff5c7a',
    rgba: [255, 92, 122, 220],
    label: 'KINETIC',
  },
  kinetic_general: {
    colorClass: 'kinetic',
    hex: '#ff5c7a',
    rgba: [255, 92, 122, 255],
    label: 'KINETIC',
  },
};

export function getDomainMeta(domain: Domain): DomainMeta {
  return DOMAIN_META[domain];
}

export function getDomainColor(domain: Domain): string {
  return DOMAIN_META[domain].hex;
}

export function getDomainRgba(domain: Domain): [number, number, number, number] {
  return DOMAIN_META[domain].rgba;
}

export function getDomainLabel(domain: Domain): string {
  return DOMAIN_META[domain].label;
}

/** The four filter categories shown in the EventTimeline tabs. */
export type DomainFilter = 'ALL' | 'CYBER' | 'ECONOMIC' | 'KINETIC' | 'INFO';

/** Whether a SimEvent domain matches the active filter. */
export function matchesDomainFilter(domain: Domain, filter: DomainFilter): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'CYBER') return domain === 'cyber';
  if (filter === 'ECONOMIC') return domain === 'economic';
  if (filter === 'KINETIC') return domain === 'kinetic_limited' || domain === 'kinetic_general';
  if (filter === 'INFO') return domain === 'info' || domain === 'diplomatic';
  return true;
}
