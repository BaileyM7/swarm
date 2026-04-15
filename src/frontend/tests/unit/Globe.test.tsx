/**
 * Globe.test.tsx — minimal unit tests for Globe.tsx.
 *
 * DeckGL and react-map-gl are mocked to avoid WebGL bootstrap in jsdom.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useSimStore } from '@/lib/store/simStore';

// ── Mock @deck.gl/react ──────────────────────────────────────────────────────
vi.mock('@deck.gl/react', () => ({
  default: vi.fn(
    ({
      onClick,
      children,
    }: {
      onClick?: (info: { object: unknown }) => void;
      children?: React.ReactNode;
    }) => (
      <div
        data-testid="deckgl"
        onClick={() =>
          onClick?.({ object: { iso3: 'CHN' } })
        }
      >
        {children}
      </div>
    ),
  ),
}));

// ── Mock @deck.gl/core ───────────────────────────────────────────────────────
vi.mock('@deck.gl/core', () => ({
  _GlobeView: class GlobeView {},
  LayerExtension: class LayerExtension {
    getShaders() { return {}; }
  },
}));

// ── Mock @deck.gl/layers ─────────────────────────────────────────────────────
vi.mock('@deck.gl/layers', () => ({
  ArcLayer: class ArcLayer { constructor(public props: unknown) {} },
  ScatterplotLayer: class ScatterplotLayer { constructor(public props: unknown) {} },
  TextLayer: class TextLayer { constructor(public props: unknown) {} },
}));

// ── Mock react-map-gl ────────────────────────────────────────────────────────
vi.mock('react-map-gl', () => ({
  default: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="mapbox">{children}</div>
  ),
}));

// ── Mock CountryHaloLayer ─────────────────────────────────────────────────────
vi.mock('@/components/Globe/CountryHaloLayer', () => ({
  makeCountryHaloLayer: () => ({ id: 'country-halo-mock' }),
}));

// ── Mock PulseArcExtension ────────────────────────────────────────────────────
vi.mock('@/components/Globe/pulseArcExtension', () => ({
  PulseArcExtension: class PulseArcExtension {
    getShaders() { return {}; }
  },
}));

// ── Import Globe after all mocks are set up ──────────────────────────────────
import { Globe } from '@/components/Globe/Globe';

describe('Globe component', () => {
  beforeEach(() => {
    useSimStore.getState().reset();
  });

  it('renders without crashing', () => {
    const onCountryClick = vi.fn();
    const onEventClick = vi.fn();
    render(<Globe onCountryClick={onCountryClick} onEventClick={onEventClick} />);
    expect(screen.getByTestId('deckgl')).toBeTruthy();
  });

  it('calls onCountryClick with iso3 when a scatter pick occurs', () => {
    const onCountryClick = vi.fn();
    const onEventClick = vi.fn();
    render(<Globe onCountryClick={onCountryClick} onEventClick={onEventClick} />);

    // The mocked DeckGL calls onClick({ object: { iso3: 'CHN' } }) on click
    fireEvent.click(screen.getByTestId('deckgl'));

    expect(onCountryClick).toHaveBeenCalledWith('CHN');
    expect(onCountryClick).toHaveBeenCalledTimes(1);
  });

  it('memoized layers reference is stable across re-renders when data is unchanged', async () => {
    const onCountryClick = vi.fn();
    const onEventClick = vi.fn();

    // Capture the layers prop passed to the mock DeckGL on first render
    const DeckGLMock = (await import('@deck.gl/react')).default as ReturnType<typeof vi.fn>;
    DeckGLMock.mockClear();

    const { rerender } = render(
      <Globe onCountryClick={onCountryClick} onEventClick={onEventClick} />,
    );

    const firstCallLayers = DeckGLMock.mock.calls[0]?.[0]?.layers;

    // Re-render with the same props — data hasn't changed
    rerender(
      <Globe onCountryClick={onCountryClick} onEventClick={onEventClick} />,
    );

    const secondCallLayers = DeckGLMock.mock.calls.at(-1)?.[0]?.layers;

    // Same array reference means useMemo returned the cached value
    expect(secondCallLayers).toBe(firstCallLayers);
  });
});
