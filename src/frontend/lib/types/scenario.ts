/**
 * TypeScript mirror of src/shared/schemas/scenario.py
 */

export type ScenarioStatus = 'draft' | 'ready' | 'archived';

export interface InitialConditions {
  posture_overrides: Record<string, string>;
  seed_events: Record<string, unknown>[];
}

/** POST /api/scenarios request body. */
export interface ScenarioCreate {
  title: string;
  description: string;
  country_ids: string[];
  initial_conditions?: Partial<InitialConditions>;
}

/** Full scenario object returned by POST and GET /api/scenarios/{id}. */
export interface ScenarioResponse {
  id: string;
  title: string;
  description: string;
  country_ids: string[];
  initial_conditions: Record<string, unknown>;
  status: ScenarioStatus;
  created_at: string;
  updated_at: string;
}

/** Lightweight item in GET /api/scenarios list. */
export interface ScenarioListItem {
  id: string;
  title: string;
  status: ScenarioStatus;
  country_ids: string[];
  created_at: string;
}

export interface ScenarioList {
  items: ScenarioListItem[];
  total: number;
  limit: number;
  offset: number;
}

/** POST /api/simulations request body. */
export interface SimulationCreate {
  scenario_id: string;
  max_turns?: number;
  config?: {
    model?: string;
    arbiter_model?: string;
    random_seed?: number;
  };
}

/**
 * Mirrors backend SimulationStatus enum exactly.
 * 'idle' is intentionally absent — the backend never emits it.
 * Frontend pre-start state is represented by simStatus === 'pending' or
 * by the separate `playbackReady` boolean in simStore.
 */
export type SimulationStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'completed'
  | 'aborted'
  | 'error';

export interface SimulationResponse {
  id: string;
  scenario_id: string;
  status: SimulationStatus;
  current_turn: number;
  max_turns: number;
  world_state_snapshot: Record<string, unknown> | null;
  config: Record<string, unknown>;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  ws_url: string;
}
