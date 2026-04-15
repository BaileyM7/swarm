/**
 * useGlobeData — derives Deck.gl layer data from the Zustand store.
 *
 * Produces:
 *   – scatterData: country scatter points with activity radius
 *   – arcData: recent sim events as arcs with domain color + age fade
 *   – haloData: country halo points for CountryHaloLayer
 */

import { useMemo } from 'react';
import { useSimStore } from '@/lib/store/simStore';
import { getDomainRgba } from '@/lib/domain';
import { getCentroid } from '@/lib/geo';
import { SLICE_COUNTRIES } from '@/lib/types/country';
import type { SimEvent } from '@/lib/types/sim-event';

const ARC_FADE_WINDOW_MS = 30_000; // arcs fade over 30 seconds

export interface ScatterPoint {
  iso3: string;
  coordinates: [number, number]; // [lon, lat]
  activityLevel: number;         // 0..1, drives radius
  isSelected: boolean;
}

export interface ArcDatum {
  id: string;
  sourcePosition: [number, number]; // [lon, lat]
  targetPosition: [number, number];
  color: [number, number, number, number]; // RGBA with age-fade alpha
  width: number;
  event: SimEvent;
}

export interface HaloDatum {
  iso3: string;
  coordinates: [number, number];
  activityLevel: number;
  isSelected: boolean;
}

export function useGlobeData() {
  const selectedCountry = useSimStore((s) => s.selectedCountry);
  const getVisibleEvents = useSimStore((s) => s.visibleEvents);

  const visibleEvents = getVisibleEvents();

  // Compute per-country activity level (recent events in last 5 turns)
  const activityMap = useMemo(() => {
    const map: Record<string, number> = {};
    const maxTurn = visibleEvents.reduce((m, e) => Math.max(m, e.turn), 0);
    for (const ev of visibleEvents) {
      const age = maxTurn - ev.turn;
      if (age > 5) continue;
      const boost = 1 - age / 5;
      map[ev.actor_country] = (map[ev.actor_country] ?? 0) + boost * 0.2;
      if (ev.target_country) {
        map[ev.target_country] =
          (map[ev.target_country] ?? 0) + boost * 0.1;
      }
    }
    // Clamp to [0, 1]
    for (const k of Object.keys(map)) {
      map[k] = Math.min(1, map[k]);
    }
    return map;
  }, [visibleEvents]);

  const scatterData: ScatterPoint[] = useMemo(
    () =>
      SLICE_COUNTRIES.map((iso3) => {
        const centroid = getCentroid(iso3);
        if (!centroid) return null;
        return {
          iso3,
          coordinates: [centroid.lon, centroid.lat],
          activityLevel: activityMap[iso3] ?? 0,
          isSelected: selectedCountry === iso3,
        };
      }).filter((x): x is ScatterPoint => x !== null),
    [activityMap, selectedCountry],
  );

  const arcData: ArcDatum[] = useMemo(() => {
    // Only show the last 40 events to keep WebGL buffer reasonable
    const recent = visibleEvents.slice(-40);
    // Capture now once per memo recompute (stable within this memo execution).
    // Age-fade uses the wall-clock time at the moment events are added to the
    // store — subsequent frame redraws do NOT recompute this memo.
    // Fine-grained per-frame fade is handled in the shader via u_time.
    const memoNow = Date.now();
    const result: ArcDatum[] = [];
    for (const ev of recent) {
      if (!ev.target_country) continue;
      const src = getCentroid(ev.actor_country);
      const tgt = getCentroid(ev.target_country);
      if (!src || !tgt) continue;

      const ageMs = memoNow - new Date(ev.timestamp).getTime();
      const ageFraction = Math.max(0, Math.min(1, ageMs / ARC_FADE_WINDOW_MS));
      const alpha = Math.round(220 * (1 - ageFraction * 0.7));

      const [r, g, b] = getDomainRgba(ev.domain);
      result.push({
        id: ev.id,
        sourcePosition: [src.lon, src.lat],
        targetPosition: [tgt.lon, tgt.lat],
        color: [r, g, b, alpha],
        width: 1 + ev.escalation_rung * 0.5,
        event: ev,
      });
    }
    return result;
  }, [visibleEvents]);

  const haloData: HaloDatum[] = useMemo(
    () =>
      SLICE_COUNTRIES.map((iso3) => {
        const centroid = getCentroid(iso3);
        if (!centroid) return null;
        return {
          iso3,
          coordinates: [centroid.lon, centroid.lat],
          activityLevel: activityMap[iso3] ?? 0,
          isSelected: selectedCountry === iso3,
        };
      }).filter((x): x is HaloDatum => x !== null),
    [activityMap, selectedCountry],
  );

  return { scatterData, arcData, haloData };
}
