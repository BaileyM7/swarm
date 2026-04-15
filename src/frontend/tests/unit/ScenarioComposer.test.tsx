import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ScenarioComposer } from '@/components/ScenarioComposer';
import { useSimStore } from '@/lib/store/simStore';

// Mock the API client
vi.mock('@/lib/api/client', () => ({
  createScenario: vi.fn().mockResolvedValue({
    id: 'scenario-1',
    title: 'Test',
    description: 'Test description',
    country_ids: ['CHN', 'TWN'],
    initial_conditions: {},
    status: 'ready',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
  createSimulation: vi.fn().mockResolvedValue({
    id: 'sim-1',
    scenario_id: 'scenario-1',
    status: 'pending',
    current_turn: 0,
    max_turns: 20,
    world_state_snapshot: null,
    config: {},
    created_at: new Date().toISOString(),
    started_at: null,
    completed_at: null,
    ws_url: '/ws/simulations/sim-1',
  }),
}));

// Mock useSimStream (no-op)
vi.mock('@/hooks/useSimStream', () => ({
  useSimStream: () => ({ control: vi.fn() }),
}));

describe('ScenarioComposer', () => {
  beforeEach(() => {
    useSimStore.getState().reset();
  });

  it('renders the textarea and simulate button', () => {
    render(<ScenarioComposer />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /execute simulation/i })).toBeInTheDocument();
  });

  it('shows a preset card for China-Taiwan 2027', () => {
    render(<ScenarioComposer />);
    expect(screen.getByText('China–Taiwan 2027')).toBeInTheDocument();
  });

  it('clicking a preset populates the textarea', () => {
    render(<ScenarioComposer />);
    fireEvent.click(screen.getByText('China–Taiwan 2027'));
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value.length).toBeGreaterThan(10);
  });

  it('shows error when submitting with empty textarea', async () => {
    render(<ScenarioComposer />);
    fireEvent.click(screen.getByRole('button', { name: /execute simulation/i }));
    await waitFor(() => {
      expect(screen.getByText(/enter a scenario description/i)).toBeInTheDocument();
    });
  });

  it('simulate button is disabled during running state', () => {
    useSimStore.setState({ simStatus: 'running' });
    render(<ScenarioComposer />);
    const btn = screen.getByRole('button', { name: /execute simulation/i });
    expect(btn).toBeDisabled();
  });
});
