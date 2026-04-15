'use client';

/**
 * WorldView — reads viewMode from the store and renders Globe or MapView.
 *
 * Both views are kept mounted once created (visibility toggled via opacity +
 * pointer-events) to avoid thrashing the WebGL context on rapid mode switches.
 * A CSS opacity transition (180ms, custom-ease) fades between them.
 */

import { useState, useEffect } from 'react';
import { useSimStore } from '@/lib/store/simStore';
import { Globe } from './Globe';
import { MapView } from './MapView';
import type { SimEvent } from '@/lib/types/sim-event';

export interface WorldViewProps {
  onCountryClick: (iso3: string) => void;
  onEventClick: (event: SimEvent) => void;
}

const FADE_STYLE = {
  transition: 'opacity 180ms cubic-bezier(.22,1,.36,1)',
} as const;

export function WorldView({ onCountryClick, onEventClick }: WorldViewProps) {
  const viewMode = useSimStore((s) => s.viewMode);

  // Track which views have been mounted at least once to avoid allocating a
  // GL context for MapView until the user first switches to it.
  const [mapMounted, setMapMounted] = useState(viewMode === 'map');

  useEffect(() => {
    if (viewMode === 'map') setMapMounted(true);
  }, [viewMode]);

  const globeVisible = viewMode === 'globe';
  const mapVisible = viewMode === 'map';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Globe layer — always mounted after first render */}
      <div
        data-testid="globe-layer"
        style={{
          ...FADE_STYLE,
          position: 'absolute',
          inset: 0,
          opacity: globeVisible ? 1 : 0,
          pointerEvents: globeVisible ? 'auto' : 'none',
        }}
      >
        <Globe onCountryClick={onCountryClick} onEventClick={onEventClick} />
      </div>

      {/* Map layer — only mounted after first switch to map mode */}
      {mapMounted && (
        <div
          data-testid="map-layer"
          style={{
            ...FADE_STYLE,
            position: 'absolute',
            inset: 0,
            opacity: mapVisible ? 1 : 0,
            pointerEvents: mapVisible ? 'auto' : 'none',
          }}
        >
          <MapView onCountryClick={onCountryClick} onEventClick={onEventClick} />
        </div>
      )}
    </div>
  );
}
