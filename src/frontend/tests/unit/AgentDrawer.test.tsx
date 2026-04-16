import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentDrawer } from '@/components/AgentDrawer';
import { useSimStore } from '@/lib/store/simStore';
import type { SimEvent } from '@/lib/types/sim-event';

// Mock SWR / useCountries
vi.mock('@/hooks/useCountries', () => ({
  useCountry: () => ({
    country: {
      id: 'test-id',
      iso3: 'TWN',
      name: 'Taiwan',
      gdp_usd: 800000000000,
      profile: {},
      doctrine: {},
      red_lines: ['PRC vessel in 12nm', 'Air incursion'],
      military_assets: {},
      updated_at: new Date().toISOString(),
    },
    isLoading: false,
    error: undefined,
  }),
  useCountries: () => ({
    countries: [],
    isLoading: false,
    error: undefined,
  }),
}));

function makeEvent(overrides: Partial<SimEvent> = {}): SimEvent {
  return {
    id: crypto.randomUUID(),
    sim_id: 'sim-1',
    parent_event_id: null,
    turn: 1,
    actor_country: 'TWN',
    target_country: 'CHN',
    domain: 'diplomatic',
    action_type: 'diplomatic_protest',
    payload: {},
    rationale: 'Test reasoning trace.',
    citations: [],
    escalation_rung: 0,
    explainability: null,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe('AgentDrawer', () => {
  const onClose = vi.fn();
  const onEventClick = vi.fn();

  it('does not render when isOpen=false', () => {
    const { container } = render(
      <AgentDrawer
        isOpen={false}
        onClose={onClose}
        onEventClick={onEventClick}
        drawerWidth={360}
      />,
    );
    expect(container.querySelector('[data-testid="agent-drawer"]')).toBeNull();
  });

  it('renders country name when open', () => {
    useSimStore.getState().setSelectedCountry('TWN');
    render(
      <AgentDrawer
        isOpen={true}
        onClose={onClose}
        onEventClick={onEventClick}
        drawerWidth={360}
      />,
    );
    expect(screen.getByText(/Taiwan/)).toBeInTheDocument();
  });

  it('calls onClose when X is clicked', () => {
    useSimStore.getState().setSelectedCountry('TWN');
    render(
      <AgentDrawer
        isOpen={true}
        onClose={onClose}
        onEventClick={onEventClick}
        drawerWidth={360}
      />,
    );
    fireEvent.click(screen.getByLabelText('Close agent drawer'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows decisions when events exist', () => {
    useSimStore.getState().setSelectedCountry('TWN');
    useSimStore.getState().addEvent(
      makeEvent({ turn: 7, action_type: 'mobilize_reserves', actor_country: 'TWN' }),
    );

    render(
      <AgentDrawer
        isOpen={true}
        onClose={onClose}
        onEventClick={onEventClick}
        drawerWidth={360}
      />,
    );
    expect(screen.getByText(/mobilize reserves/i)).toBeInTheDocument();
  });

  it('renders decision reasoning by default, collapses on click, re-expands on second click', () => {
    // AgentDrawer now starts every decision EXPANDED so the
    // "X did Y because Z in hopes of W" card is visible inline
    // without requiring a click — matching the Taiwan-demo visual.
    // Click once → collapses.  Click again → re-expands.
    useSimStore.getState().setSelectedCountry('TWN');
    useSimStore.getState().addEvent(
      makeEvent({ turn: 5, rationale: 'Important reasoning text here.' }),
    );

    render(
      <AgentDrawer
        isOpen={true}
        onClose={onClose}
        onEventClick={onEventClick}
        drawerWidth={360}
      />,
    );

    // Visible by default (no click needed)
    expect(screen.getByText('Important reasoning text here.')).toBeInTheDocument();

    // Click → collapses
    const decisionBtn = screen.getByRole('button', { name: /t_05/i });
    fireEvent.click(decisionBtn);
    expect(screen.queryByText('Important reasoning text here.')).not.toBeInTheDocument();

    // Click again → re-expands
    fireEvent.click(decisionBtn);
    expect(screen.getByText('Important reasoning text here.')).toBeInTheDocument();
  });
});
