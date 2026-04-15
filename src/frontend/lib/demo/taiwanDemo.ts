/**
 * Scripted, front-end-only demo of the Taiwan 2027 quarantine scenario.
 *
 * Dispatches 12 plausible SimEvents into the Zustand store over ~15 s so the
 * globe arcs, event timeline, and agent drawer all animate exactly as they
 * would with a live backend run — but with zero LLM/network dependency. This
 * is the "demo mode" button handler.
 *
 * Events are rationale-rich enough to hold up on a projector: each carries a
 * short audit-quality paragraph and 1-2 citation stubs that render in the
 * EventDetailCard when the user clicks an arc.
 */

import type { SimEvent, Domain, EscalationRung, Citation } from '@/lib/types/sim-event';
import { useSimStore } from '@/lib/store/simStore';

const DEMO_SIM_ID = '00000000-0000-0000-0000-000000000d30';
const INTER_EVENT_MS = 1200;      // pulse arc travel + small breathing room
const INTER_TURN_MS = 600;         // tiny pause between turns for pacing

interface DemoEventSpec {
  actor: string;
  target: string | null;
  domain: Domain;
  action_type: string;
  rung: EscalationRung;
  rationale: string;
  citations?: Citation[];
  payload?: Record<string, unknown>;
}

// 3 turns × 4 events = 12 events total.
const SCRIPT: DemoEventSpec[][] = [
  // ── Turn 0 — Opening move + immediate diplomatic firestorm ─────────────
  [
    {
      actor: 'CHN',
      target: 'TWN',
      domain: 'kinetic_limited',
      action_type: 'maritime_quarantine_declaration',
      rung: 3,
      rationale:
        'PLAN Eastern Theater declares a customs quarantine across the Taiwan Strait and a 200 nm zone around Taiwan, framed as domestic law-enforcement rather than blockade. This preserves legal ambiguity while imposing kinetic-adjacent pressure on shipping — the canonical gray-zone opening.',
      citations: [
        { source: 'gdelt', ref: 'GDELT#2027-03-04-CHN-TWN-170' },
        { source: 'acled', ref: 'ACLED#strait-2027-q1-01' },
      ],
      payload: { area: 'Taiwan Strait + 200nm EEZ', assets: ['Type 055', 'Type 052D', 'CCG cutters'] },
    },
    {
      actor: 'USA',
      target: 'CHN',
      domain: 'diplomatic',
      action_type: 'condemnation_statement',
      rung: 1,
      rationale:
        'NSC issues a Tier-1 statement condemning the quarantine as coercion inconsistent with UNCLOS Part III, reaffirms the TRA, and signals the 7th Fleet posture shift without yet committing to kinetic response. Objective: anchor allied reaction without foreclosing escalation options.',
      citations: [{ source: 'state.gov', ref: 'press-2027-03-04' }],
    },
    {
      actor: 'JPN',
      target: 'CHN',
      domain: 'diplomatic',
      action_type: 'diplomatic_protest',
      rung: 1,
      rationale:
        'MOFA summons the PRC Ambassador; Kantei coordinates with Okinawa Prefecture and US INDOPACOM. Japan sees the quarantine as a direct precursor to Senkaku escalation given the adjacency of PLA deployments to the Nansei Shoto corridor.',
    },
    {
      actor: 'PHL',
      target: 'CHN',
      domain: 'diplomatic',
      action_type: 'joint_statement_with_allies',
      rung: 1,
      rationale:
        'Malacañang aligns with the US/JPN condemnation and quietly activates EDCA base readiness at Basa and Camilo Osias. Publicly frames the response as maritime-domain-awareness, privately green-lights US ISR basing requests.',
    },
  ],

  // ── Turn 1 — Economic battery + gray-zone expansion ────────────────────
  [
    {
      actor: 'USA',
      target: 'TWN',
      domain: 'economic',
      action_type: 'accelerated_arms_package',
      rung: 2,
      rationale:
        'Presidential Drawdown Authority invoked for a $2.4B package: Harpoon Block II, Stinger, HIMARS rockets, NASAMS batteries. Signals commitment to porcupine strategy; intended to stiffen Taiwanese resolve and complicate PLA planning without directly engaging US forces.',
      citations: [{ source: 'sec_edgar', ref: 'DSCA-notif-2027-03-05' }],
    },
    {
      actor: 'CHN',
      target: 'PHL',
      domain: 'kinetic_limited',
      action_type: 'coast_guard_harassment',
      rung: 2,
      rationale:
        'CCG water cannons and laser-dazzle a BFAR resupply convoy near Second Thomas Shoal. Designed to split Manila from the US-JPN response and demonstrate capacity for simultaneous multi-theater pressure in the South China Sea.',
      citations: [{ source: 'acled', ref: 'ACLED#scs-2027-03-05-02' }],
    },
    {
      actor: 'USA',
      target: 'CHN',
      domain: 'economic',
      action_type: 'tier2_sanctions_package',
      rung: 2,
      rationale:
        'Treasury/OFAC designates 17 PLA-linked shipping entities; Commerce expands entity list to include two provincial port authorities. Calibrated to hurt but reversible, preserving off-ramps for Beijing.',
      citations: [{ source: 'ofac_sdn', ref: 'SDN-2027-03-05-batch-7' }],
    },
    {
      actor: 'CHN',
      target: 'USA',
      domain: 'economic',
      action_type: 'rare_earth_export_controls',
      rung: 2,
      rationale:
        'MofCOM imposes export licensing on gallium, germanium, and dysprosium — the three chokepoint materials for US defense semiconductors. Reciprocal in form, asymmetric in effect: US has ~90 days of strategic stockpile.',
      citations: [{ source: 'un_comtrade', ref: 'UNCOM#HS2804-2027Q1' }],
    },
  ],

  // ── Turn 2 — Military posturing edges toward a tripwire ────────────────
  [
    {
      actor: 'USA',
      target: 'JPN',
      domain: 'kinetic_limited',
      action_type: 'carrier_group_surge',
      rung: 3,
      rationale:
        'CVN-76 RONALD REAGAN redeploys from Yokosuka to the Philippine Sea; CVN-70 CARL VINSON surges from San Diego. Two-carrier presence east of Taiwan is the standing doctrine threshold for credible deterrence.',
      citations: [{ source: 'marinecadastre_ais', ref: 'AIS-PACFLT-2027-03-06' }],
    },
    {
      actor: 'CHN',
      target: 'TWN',
      domain: 'kinetic_limited',
      action_type: 'submarine_close_approach',
      rung: 3,
      rationale:
        'Type 093B SSN detected 25 nm off Keelung by ROC Navy P-3C — closest approach on record. Signals PLA willingness to accept detection cost in exchange for demonstrating subsurface dominance inside the first island chain.',
    },
    {
      actor: 'JPN',
      target: 'CHN',
      domain: 'kinetic_limited',
      action_type: 'sdf_alert_level_raised',
      rung: 3,
      rationale:
        'Japan Self-Defense Forces raise Western Army Air readiness to B-level; F-35A squadrons surge to Naha AB. Intended as proportional signalling — visible preparation without tripping the constitutional-debate threshold.',
    },
    {
      actor: 'USA',
      target: 'CHN',
      domain: 'cyber',
      action_type: 'attribution_and_deterrence_signal',
      rung: 2,
      rationale:
        'CISA + NSA jointly attribute a prepositioning campaign against US West Coast port OT systems to APT "VOLT TYPHOON," releasing high-confidence IOCs publicly. Deterrent signal: we see you, and we are willing to burn our collection to say so.',
      citations: [{ source: 'cisa.gov', ref: 'AA27-065A' }],
    },
  ],
];

/**
 * Play the scripted demo, dispatching events one-by-one into the store.
 * Returns a function that cancels the remaining dispatches.
 */
export function runTaiwanDemo(): () => void {
  const store = useSimStore.getState();

  // Reset + mark as running so the UI chrome responds correctly.
  store.reset();
  store.clearEvents();
  // Intentionally leave currentSimId null so useSimStream doesn't try to
  // open a WebSocket to /ws/simulations/<demo-uuid> (that sim doesn't exist
  // server-side). The demo drives the store directly.
  store.setCurrentSimId(null);
  store.setSimStatus('running');
  store.setMaxTurns(SCRIPT.length);
  store.setCurrentTurn(0);

  let cancelled = false;
  const timers: ReturnType<typeof setTimeout>[] = [];

  let elapsed = 0;
  let eventSeq = 0;

  SCRIPT.forEach((turnEvents, turnIdx) => {
    // Dispatch a turn-boundary marker: bump currentTurn at the top of each turn
    timers.push(
      setTimeout(() => {
        if (cancelled) return;
        useSimStore.getState().setCurrentTurn(turnIdx);
      }, elapsed),
    );

    turnEvents.forEach((spec) => {
      const fireAt = elapsed;
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          const nowIso = new Date().toISOString();
          const evt: SimEvent = {
            id: cryptoRandomId(),
            sim_id: DEMO_SIM_ID,
            parent_event_id: null,
            turn: turnIdx,
            actor_country: spec.actor,
            target_country: spec.target,
            domain: spec.domain,
            action_type: spec.action_type,
            payload: {
              ...(spec.payload ?? {}),
              _origin: 'demo',
            },
            rationale: spec.rationale,
            citations: spec.citations ?? [],
            escalation_rung: spec.rung,
            timestamp: nowIso,
          };
          useSimStore.getState().addEvent(evt);
          eventSeq += 1;
        }, fireAt),
      );
      elapsed += INTER_EVENT_MS;
    });

    elapsed += INTER_TURN_MS;
  });

  // Final: mark completed so PlaybackControls show the right state.
  timers.push(
    setTimeout(() => {
      if (cancelled) return;
      useSimStore.getState().setSimStatus('completed');
    }, elapsed + 300),
  );

  return () => {
    cancelled = true;
    timers.forEach(clearTimeout);
  };
}

/** UUID v4-ish using crypto.randomUUID where available, fallback otherwise. */
function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback — not cryptographically strong but unique enough for demo events.
  return 'demo-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);
}
