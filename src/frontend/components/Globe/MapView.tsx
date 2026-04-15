'use client';

/**
 * MapView.tsx — flat Mercator map using Deck.gl MapView (no Mapbox token).
 *
 * Basemap: GeoJsonLayer rendering world country wireframe outlines (no fill).
 * Simulation layers: same ScatterplotLayer + ArcLayer + CountryHaloLayer via
 * useWorldLayers — identical data as Globe, slightly smaller node radii.
 */

import { useState, useCallback, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { MapView as DeckMapView } from '@deck.gl/core';
import type { PickingInfo } from '@deck.gl/core';
import type { SimEvent } from '@/lib/types/sim-event';
import { useSimStore } from '@/lib/store/simStore';
import { useWorldLayers } from './useWorldLayers';
import { PulseArcExtension } from './pulseArcExtension';

// Whole world in view by default. longitude=10 centers Europe/Africa/Asia;
// zoom 1.2 fits the world into ~800–1100 px of usable width (globe center
// column after sidebar + drawer). `repeat: true` on the view wraps the map
// horizontally so horizontal pan never shows empty gutters.
const INITIAL_VIEW_STATE = {
  longitude: 10,
  latitude: 20,
  zoom: 1.2,
  minZoom: 0.5,
  maxZoom: 6,
  pitch: 0,
  bearing: 0,
};

export interface MapViewProps {
  onCountryClick: (iso3: string) => void;
  onEventClick: (event: SimEvent) => void;
}

export function MapView({ onCountryClick, onEventClick }: MapViewProps) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

  // Stable extension — never re-compiled; draw() uses Date.now() internally
  const pulseExtension = useMemo(() => new PulseArcExtension(), []);

  // useWorldLayers now includes the filled-country basemap layer, so MapView
  // no longer needs its own GeoJson wireframe layer.
  const { layers } = useWorldLayers({
    viewMode: 'map',
    onCountryClick,
    onEventClick,
    pulseExtension,
  });

  const setSelectedCountry = useSimStore((s) => s.setSelectedCountry);
  const setSelectedEvent = useSimStore((s) => s.setSelectedEvent);

  const handleClick = useCallback(
    (info: PickingInfo) => {
      if (!info.object) {
        setSelectedCountry(null);
        setSelectedEvent(null);
        return;
      }
      const obj = info.object as Record<string, unknown>;
      if ('iso3' in obj) {
        onCountryClick(obj.iso3 as string);
        return;
      }
      if ('event' in obj) {
        onEventClick(obj.event as SimEvent);
      }
    },
    [onCountryClick, onEventClick, setSelectedCountry, setSelectedEvent],
  );

  return (
    <DeckGL
      views={new DeckMapView({ id: 'map', repeat: true })}
      viewState={viewState}
      onViewStateChange={({ viewState: vs }) =>
        setViewState(vs as typeof viewState)
      }
      layers={layers}
      onClick={handleClick}
      controller={{ dragRotate: false, scrollZoom: true }}
      style={{ width: '100%', height: '100%' }}
      parameters={{
        clearColor: [0.04, 0.055, 0.1, 1], // #0a0e1a
      }}
    />
  );
}
