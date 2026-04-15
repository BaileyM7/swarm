import { describe, it, expect, beforeEach } from 'vitest';
import { useSimStore } from '@/lib/store/simStore';
import type { SimEvent } from '@/lib/types/sim-event';

function makeEvent(overrides: Partial<SimEvent> = {}): SimEvent {
  return {
    id: crypto.randomUUID(),
    sim_id: 'sim-1',
    parent_event_id: null,
    turn: 1,
    actor_country: 'CHN',
    target_country: 'TWN',
    domain: 'cyber',
    action_type: 'test_action',
    payload: {},
    rationale: 'Test rationale',
    citations: [],
    escalation_rung: 1,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe('simStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useSimStore.getState().reset();
    useSimStore.setState({ simStatus: null, currentTurn: 0, maxTurns: 20 });
  });

  it('starts with null status (no simulation started)', () => {
    expect(useSimStore.getState().simStatus).toBeNull();
  });

  it('addEvent appends event to array', () => {
    const ev = makeEvent();
    useSimStore.getState().addEvent(ev);
    expect(useSimStore.getState().events).toHaveLength(1);
    expect(useSimStore.getState().events[0].id).toBe(ev.id);
  });

  it('clearEvents empties the array', () => {
    useSimStore.getState().addEvent(makeEvent());
    useSimStore.getState().clearEvents();
    expect(useSimStore.getState().events).toHaveLength(0);
  });

  it('setSimStatus updates status', () => {
    useSimStore.getState().setSimStatus('running');
    expect(useSimStore.getState().simStatus).toBe('running');
  });

  it('setCurrentTurn updates turn and scrubber in live mode', () => {
    useSimStore.setState({ playbackMode: 'live' });
    useSimStore.getState().setCurrentTurn(5);
    expect(useSimStore.getState().currentTurn).toBe(5);
    expect(useSimStore.getState().scrubberTurn).toBe(5);
  });

  it('setCurrentTurn does NOT update scrubber in scrubbing mode', () => {
    useSimStore.setState({ playbackMode: 'scrubbing', scrubberTurn: 3 });
    useSimStore.getState().setCurrentTurn(7);
    expect(useSimStore.getState().scrubberTurn).toBe(3);
  });

  it('visibleEvents returns all events in live mode', () => {
    useSimStore.setState({ playbackMode: 'live' });
    useSimStore.getState().addEvent(makeEvent({ turn: 1 }));
    useSimStore.getState().addEvent(makeEvent({ turn: 5 }));
    expect(useSimStore.getState().visibleEvents()).toHaveLength(2);
  });

  it('visibleEvents filters by scrubberTurn in scrubbing mode', () => {
    useSimStore.setState({ playbackMode: 'scrubbing', scrubberTurn: 3 });
    useSimStore.getState().addEvent(makeEvent({ turn: 1 }));
    useSimStore.getState().addEvent(makeEvent({ turn: 3 }));
    useSimStore.getState().addEvent(makeEvent({ turn: 5 }));
    const visible = useSimStore.getState().visibleEvents();
    expect(visible).toHaveLength(2);
    expect(visible.every((e) => e.turn <= 3)).toBe(true);
  });

  it('setSelectedCountry updates selectedCountry', () => {
    useSimStore.getState().setSelectedCountry('CHN');
    expect(useSimStore.getState().selectedCountry).toBe('CHN');
  });

  it('reset clears events and resets status to null', () => {
    useSimStore.getState().addEvent(makeEvent());
    useSimStore.getState().setSimStatus('running');
    useSimStore.getState().reset();
    expect(useSimStore.getState().events).toHaveLength(0);
    expect(useSimStore.getState().simStatus).toBeNull();
  });
});
