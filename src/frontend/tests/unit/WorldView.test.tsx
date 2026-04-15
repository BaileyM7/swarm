/**
 * WorldView.test.tsx
 *
 * - Renders WorldView with viewMode='globe' → Globe mounts, Map hidden.
 * - Switches to viewMode='map' → MapView mounts/visible, Globe hidden.
 * - ViewToggle click updates the store.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useSimStore } from '@/lib/store/simStore';

// ── Mock @deck.gl/react ──────────────────────────────────────────────────────
vi.mock('@deck.gl/react', () => ({
  default: vi.fn(({ children }: { children?: React.ReactNode }) => (
    <div data-testid="deckgl">{children}</div>
  )),
}));

// ── Mock @deck.gl/core ───────────────────────────────────────────────────────
vi.mock('@deck.gl/core', () => ({
  _GlobeView: class GlobeView {},
  MapView: class MapView {},
  LayerExtension: class LayerExtension {
    getShaders() { return {}; }
    draw() {}
    initializeState() {}
  },
}));

// ── Mock @deck.gl/layers ─────────────────────────────────────────────────────
vi.mock('@deck.gl/layers', () => ({
  ArcLayer: class ArcLayer { constructor(public props: unknown) {} },
  ScatterplotLayer: class ScatterplotLayer { constructor(public props: unknown) {} },
  TextLayer: class TextLayer { constructor(public props: unknown) {} },
  GeoJsonLayer: class GeoJsonLayer { constructor(public props: unknown) {} },
}));

// ── Mock world-atlas ─────────────────────────────────────────────────────────
vi.mock('world-atlas/countries-110m.json', () => ({
  default: { type: 'Topology', objects: { countries: { type: 'GeometryCollection', geometries: [] } }, arcs: [], transform: { scale: [1,1], translate: [0,0] } },
}));

// ── Mock topojson-client ─────────────────────────────────────────────────────
vi.mock('topojson-client', () => ({
  feature: () => ({ type: 'FeatureCollection', features: [] }),
}));

// ── Mock CountryHaloLayer ────────────────────────────────────────────────────
vi.mock('@/components/Globe/CountryHaloLayer', () => ({
  makeCountryHaloLayer: () => ({ id: 'country-halo-mock' }),
}));

// ── Mock PulseArcExtension ───────────────────────────────────────────────────
vi.mock('@/components/Globe/pulseArcExtension', () => ({
  PulseArcExtension: class PulseArcExtension {
    getShaders() { return {}; }
    draw() {}
    initializeState() {}
  },
}));

import { WorldView } from '@/components/Globe/WorldView';
import { ViewToggle } from '@/components/ViewToggle';

const noop = () => {};

describe('WorldView', () => {
  beforeEach(() => {
    useSimStore.getState().reset();
    // Ensure globe mode
    useSimStore.getState().setViewMode('globe');
  });

  it('shows Globe layer and hides Map layer when viewMode is globe', () => {
    render(<WorldView onCountryClick={noop} onEventClick={noop} />);

    const globeLayer = screen.getByTestId('globe-layer');
    expect(globeLayer.style.opacity).toBe('1');
    expect(globeLayer.style.pointerEvents).toBe('auto');

    // Map layer should not be mounted yet (lazy mount)
    expect(screen.queryByTestId('map-layer')).toBeNull();
  });

  it('mounts and shows MapView when viewMode switches to map', async () => {
    render(<WorldView onCountryClick={noop} onEventClick={noop} />);

    // Switch to map
    act(() => {
      useSimStore.getState().setViewMode('map');
    });

    const mapLayer = await screen.findByTestId('map-layer');
    expect(mapLayer.style.opacity).toBe('1');
    expect(mapLayer.style.pointerEvents).toBe('auto');

    const globeLayer = screen.getByTestId('globe-layer');
    expect(globeLayer.style.opacity).toBe('0');
    expect(globeLayer.style.pointerEvents).toBe('none');
  });

  it('keeps both layers in DOM after switching back to globe', async () => {
    render(<WorldView onCountryClick={noop} onEventClick={noop} />);

    act(() => { useSimStore.getState().setViewMode('map'); });
    act(() => { useSimStore.getState().setViewMode('globe'); });

    expect(screen.getByTestId('globe-layer').style.opacity).toBe('1');
    expect(screen.getByTestId('map-layer').style.opacity).toBe('0');
  });
});

describe('ViewToggle', () => {
  beforeEach(() => {
    useSimStore.getState().reset();
    useSimStore.getState().setViewMode('globe');
  });

  it('renders both GLOBE and MAP segments', () => {
    render(<ViewToggle />);
    expect(screen.getByText('GLOBE')).toBeTruthy();
    expect(screen.getByText('MAP')).toBeTruthy();
  });

  it('clicking MAP updates store to map mode', () => {
    render(<ViewToggle />);
    fireEvent.click(screen.getByText('MAP'));
    expect(useSimStore.getState().viewMode).toBe('map');
  });

  it('clicking GLOBE updates store to globe mode', () => {
    useSimStore.getState().setViewMode('map');
    render(<ViewToggle />);
    fireEvent.click(screen.getByText('GLOBE'));
    expect(useSimStore.getState().viewMode).toBe('globe');
  });

  it('active segment has aria-checked=true', () => {
    render(<ViewToggle />);
    const globeBtn = screen.getByRole('radio', { name: /globe/i });
    const mapBtn = screen.getByRole('radio', { name: /map/i });
    expect(globeBtn.getAttribute('aria-checked')).toBe('true');
    expect(mapBtn.getAttribute('aria-checked')).toBe('false');
  });

  it('Enter key on inactive segment switches view mode', () => {
    render(<ViewToggle />);
    const mapBtn = screen.getByRole('radio', { name: /map/i });
    fireEvent.keyDown(mapBtn, { key: 'Enter' });
    expect(useSimStore.getState().viewMode).toBe('map');
  });
});
