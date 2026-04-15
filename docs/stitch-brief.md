## Stitch Design Brief

### App Overview

Swarm is a wargame simulator web application built for defense decision makers at organizations like the Department of Defense. Users type a "what-if" geopolitical scenario — for example, "China initiates a quarantine blockade of Taiwan in 2027" — click Simulate, and watch a live agent-based simulation play out on a 3D globe. Ten country agents (CHN, TWN, USA, JPN, KOR, PHL, AUS, PRK, RUS, IND) reason and act over multiple turns; each action streams to the front end as an animated pulse arc traveling between country nodes, color-coded by domain. The aesthetic is a dark, defense-grade situational-awareness console: think Palantir Gotham crossed with Linear — data-dense, zero decorative cruft, with glowing neural-network pulse arcs as the one expressive motion element.

---

### Design Direction

- **Aesthetic:** Dark mode only. Navy-black base (#0a0e1a), subtle film-grain noise texture overlay at 3–4% opacity. Country nodes radiate a soft radial glow that brightens with activity. Globe surface is desaturated dark (#111827-ish land, near-black ocean) with faint latitude/longitude grid lines at 8% opacity. Pulse arcs are the visual centerpiece — bright, traveling light pulses animated along curved paths between nodes. No gradients on UI chrome; flat dark panels with 1px borders at ~12% white opacity.
- **Tone:** Professional, data-dense, zero decorative cruft. Every pixel earns its place. Feels like a defense-grade situational-awareness console that a serious analyst would trust. Closest references: Palantir Gotham, Linear, Vercel dashboard, and a Bloomberg Terminal — not a consumer product.
- **Domain color system (critical — used everywhere):**
  - Cyber: `#5bc9ff` (cool cyan)
  - Economic: `#f5a623` (amber)
  - Information / Diplomatic: `#a78bfa` (violet)
  - Kinetic: `#ff5c7a` (coral-red)
  - Neutral / UI accent: `#5bc9ff` (same cyan; use sparingly for interactive affordances)
- **Typography:**
  - Body / UI labels: `Geist Sans` — weights 400 and 500 only
  - Data / telemetry (turn counts, event IDs, timestamps, citations, coordinates): `Geist Mono` — weight 400
  - No display / editorial fonts; this is a console, not a marketing page
- **Iconography:** Minimal line icons, 1.5px stroke, monochrome (white at 60% opacity at rest, 100% on hover/active). Phosphor Icons or Heroicons set recommended.
- **Reference URLs:**
  - https://palantir.com/gotham (tone, density)
  - https://linear.app (component polish, spacing)
  - https://vercel.com/dashboard (dark UI chrome quality)

---

### Screens Needed

#### 1. Home / Globe

- **Purpose:** The hero screen. Occupies the full browser viewport at all times. The 3D globe is the primary element. A left sidebar contains the Scenario Composer. A right drawer slides in when a country is selected. A bottom dock contains the Event Timeline. This is the only screen in the app — all other "views" are panels layered on top of the globe.

- **Key Components:**
  - `GlobeCanvas` — full-viewport Deck.gl GlobeView, fills 100% width/height, renders below all panels
  - `CountryNode` — per-country overlay label (flag emoji + ISO code) positioned at lat/lng, with radial glow ring pulsing on activity
  - Pulse arcs — animated light-pulse paths between nodes, color-coded by domain
  - `ScenarioComposer` — left sidebar panel, always visible on desktop
  - `AgentDrawer` — right panel, hidden until a country is clicked
  - `EventTimeline` — bottom dock, collapsed by default, expandable
  - `Loader` (pulse-themed) — shown over the globe canvas while a sim is initializing
  - `ErrorBoundaryCard` — shown in the globe center if the 3D render fails

- **Data Displayed (with realistic example values):**
  - Globe shows 10 active country nodes at their geographic centroids
  - Active arc example: `CHN → TWN | domain: kinetic | action: "Naval carrier group moves to ADIZ boundary" | turn: 3`
  - Node activity intensity: CHN at 0.92, TWN at 0.88, USA at 0.71 (drives glow radius)
  - Turn counter in top-right corner of canvas: `Turn 7 / 20`
  - Simulation ID watermark bottom-left: `SIM-2027-TW-001`

- **User Actions:**
  - Click a country node → opens `AgentDrawer` on the right
  - Click an arc / event pulse → opens `EventDetailCard` inline
  - All other interactions are handled within the sidebar and dock panels
  - Mouse drag to rotate globe; scroll to zoom; right-click drag to pan

- **Navigation:**
  - Entry point — user lands here on first load, no other pages exist
  - All other panels (AgentDrawer, EventTimeline, EventDetailCard) layer on top of this screen

---

#### 2. Scenario Composer (Left Sidebar)

- **Purpose:** The primary control surface. Users write or pick a scenario, launch the simulation, and control playback. Always visible on desktop as a left sidebar (320px wide). Does not cover the globe — the globe viewport adjusts to account for it.

- **Key Components:**
  - Sidebar header: "SWARM" wordmark in `Geist Mono` + build version `v0.1.0-alpha`
  - `ScenarioInput` — multiline textarea for free-text scenario entry, 4–6 rows, monospace font, dark background with subtle border
  - `PresetCard` grid — 2-column grid of preset scenario cards; first preset always visible is "China–Taiwan 2027"
  - `Button` (primary) — "Simulate" CTA, full width, cyan background, bold label
  - Divider: thin horizontal rule with "or write your own" label centered
  - `PlaybackControls` — appears only when a sim is running or paused; contains pause/resume/abort buttons
  - `TurnScrubber` — horizontal slider with tick marks for each completed turn, appears during/after sim run
  - Status indicator: small dot + label (Idle / Running / Paused / Complete / Error)
  - Turn stats row: `Geist Mono` text showing `Turn 7 of 20 | 3 active events | Est. $0.04`

- **Data Displayed (with realistic example values):**
  - `ScenarioInput` placeholder: `"China initiates a naval quarantine of Taiwan. How do regional actors respond over 90 days?"`
  - Preset card 1: label "China–Taiwan 2027", subtitle "10 agents · 20 turns · ~60s", domain tags: kinetic, cyber, economic
  - Preset card 2: label "Korean Peninsula Crisis", subtitle "6 agents · 15 turns · ~40s", domain tags: kinetic, info, diplomatic — shown as "Coming Soon" (disabled, reduced opacity)
  - Preset card 3: label "South China Sea Standoff", subtitle "8 agents · 20 turns · ~55s" — "Coming Soon"
  - `TurnScrubber` showing Turn 7 of 20, with turns 1–7 filled in cyan, turns 8–20 as empty ticks
  - `PlaybackControls` in paused state showing: Pause icon (active), Resume button, Abort button

- **User Actions:**
  - Type in `ScenarioInput` to compose a free-text scenario
  - Click a `PresetCard` to auto-populate the input (and pre-select 10 countries on the globe)
  - Click "Simulate" to submit and start the simulation
  - During sim: click Pause, Resume, or Abort
  - Drag `TurnScrubber` to scrub to any completed turn
  - Click turn tick marks on `TurnScrubber` to jump to a specific turn

- **Navigation:**
  - "Simulate" triggers globe animation and activates `EventTimeline` dock
  - Scrubbing the `TurnScrubber` updates globe state and `EventTimeline` to the selected turn

---

#### 3. Agent Detail Drawer (Right Side)

- **Purpose:** Shows the internal state of a country agent — its current strategic posture, which red lines have been crossed or are near crossing, and its most recent decisions with full reasoning traces. Slides in from the right when a country node is clicked. Overlays the globe on tablet; pushes the globe viewport on desktop (option: overlay on desktop too, with globe re-centering to the selected country).

- **Key Components:**
  - Drawer header: country flag (emoji, 24px) + full country name + ISO code + close button (`IconButton`)
  - Posture badge: `DomainBadge`-style pill showing current posture (e.g., "Heightened Alert", "Active Defense", "Escalatory") with appropriate domain color
  - Section: "Red Lines" — `RedLineItem` list (3–6 items), each with a color-coded status indicator and label
  - Section: "Recent Decisions" — `DecisionRow` list (latest 5), each expandable to show the LLM reasoning trace
  - Footer: "Last updated Turn 7" in `Geist Mono`, faded

- **Data Displayed (with realistic example values):**
  - Country: Taiwan (TWN), flag: 🇹🇼
  - Posture: "Active Defense" (amber badge)
  - Red Lines:
    - "PRC naval vessel enters 12nm territorial water" — status: amber (near), not yet crossed
    - "Air incursion over main island" — status: green (clear)
    - "Cyberattack on TSMC fab network" — status: red (crossed, Turn 4)
    - "Diplomatic recognition withdrawn by ally" — status: green (clear)
  - Recent Decisions:
    - Turn 7: "Mobilize reserve forces (Tier 2)" — click to expand → reasoning: "TSMC breach confirms hostile intent. Per doctrine Section 4.2, reserve mobilization triggered at cyber-tier threshold. USA carrier group transit provides escalation cover. Confidence: HIGH."
    - Turn 6: "Issue formal diplomatic protest via back-channel" — reasoning trace visible on expand
    - Turn 5: "Request emergency UN Security Council session" — reasoning trace visible on expand

- **User Actions:**
  - Click close button (`IconButton` top-right) to slide drawer out
  - Click a `DecisionRow` to expand/collapse its reasoning trace
  - Click a `RedLineItem` that is crossed (red) to see which `SimEvent` triggered it (links to `EventDetailCard`)
  - Scroll vertically within the drawer for long decision lists

- **Navigation:**
  - Opened by clicking a country node on the globe
  - Closed by clicking the X button, pressing Escape, or clicking another country (replaces content)
  - Clicking a red-line event ID navigates to open `EventDetailCard` for that event

---

#### 4. Event Timeline (Bottom Dock)

- **Purpose:** A chronological, filterable stream of all `SimEvent`s emitted during the simulation. Collapsed to a thin dock bar by default; expands upward on click. Each event is a pill. New events animate in from the right as the sim progresses. Users can filter by domain to focus on a specific conflict dimension.

- **Key Components:**
  - Dock toggle bar: "EVENTS" label in `Geist Mono` caps + event count badge + collapse/expand chevron icon
  - Domain filter tabs: ALL | CYBER | ECONOMIC | KINETIC | INFO — each tab has its domain color; active tab is underlined
  - `TimelineTrack` — horizontally scrollable track of `EventPill` components, ordered left-to-right by turn number
  - Turn group separators: faint vertical dividers with turn number label (T1, T2, ... T7)
  - `EventPill` — compact pill showing: domain color dot + actor ISO code + action verb + target ISO code (e.g., "CHN → TWN  Naval Blockade")
  - Empty state: `EmptyState` component — "Run a simulation to see events" with pulse loader icon

- **Data Displayed (with realistic example values):**
  - Turn 1 group:
    - Pill: `CHN → TWN` | kinetic (red) | "Naval Quarantine Declared"
    - Pill: `USA → CHN` | info (violet) | "Diplomatic Warning Issued"
  - Turn 2 group:
    - Pill: `CHN → TWN` | cyber (cyan) | "TSMC Supply Chain Probe"
    - Pill: `JPN → USA` | diplomatic (violet) | "Mutual Defense Consultation"
    - Pill: `TWN → USA` | diplomatic (violet) | "Emergency Arms Request"
  - Turn 3 group:
    - Pill: `CHN → TWN` | economic (amber) | "Semiconductor Export Ban"
    - Pill: `USA → CHN` | economic (amber) | "SWIFT Access Threat"
  - Event count badge: 23 events shown across 7 turns

- **User Actions:**
  - Click dock toggle bar to expand/collapse the timeline
  - Click a domain filter tab to filter pills by domain (ALL is default)
  - Scroll horizontally within `TimelineTrack` to navigate through turns
  - Click an `EventPill` to open `EventDetailCard` (inline card above the pill)
  - Hover over a pill to preview actor + action + domain tooltip

- **Navigation:**
  - Clicking a pill opens `EventDetailCard` inline above the clicked pill position
  - `EventDetailCard` has a close button to return to timeline-only view
  - If a country is selected in the drawer, pills for that country are visually highlighted

---

#### 5. Event Detail Card

- **Purpose:** Shows the full content of a single `SimEvent` — the decision rationale written by the LLM agent, the actor and target, the domain and action type, and all data sources cited by the agent in making its decision. Opens inline above the `EventPill` that was clicked, or as a floating card if triggered from the `AgentDrawer`.

- **Key Components:**
  - Card header: `DomainBadge` (colored by domain) + event ID in `Geist Mono` (e.g., `EVT-007`) + close `IconButton`
  - Actor → Target row: flag emoji + ISO code for both sides, connected by an arrow glyph, with domain color
  - Action label: bold, larger text — the action name (e.g., "Naval Quarantine Declared")
  - Turn + timestamp row: `Geist Mono` — `Turn 3 · 2027-03-14T09:42:11Z`
  - Section: "Rationale" — full LLM reasoning paragraph, body text, `Geist Sans`, left-aligned, line-height relaxed
  - Section: "Data Sources" — horizontal wrap of `CitationChip` components
  - `CitationChip` — small pill with source name badge (GDELT, ACLED, World Bank, FRED, UN Comtrade, etc.) + abbreviated reference text

- **Data Displayed (with realistic example values):**
  - Event ID: `EVT-007`
  - Domain badge: KINETIC (coral-red)
  - Actor: 🇨🇳 CHN → Target: 🇹🇼 TWN
  - Action: "Naval Quarantine Declared"
  - Turn: 3 · `2027-03-14T09:42:11Z`
  - Rationale: "The People's Liberation Army Navy has positioned three carrier battle groups in a triangular formation covering the Luzon Strait, Bashi Channel, and Taiwan Strait northern approaches. A formal quarantine declaration was issued to the UN on 2027-03-14. This action is consistent with PRC doctrine on 'active defense' and follows the failure of two prior diplomatic warnings. Red-line threshold for kinetic action not yet met. USA carrier group CSG-11 is 480nm from the strait — within 48h response window. Probability of military interdiction attempt by USA assessed at 38% within 72 hours based on historical precedent from 1996 crisis and current political signaling."
  - Citations:
    - `GDELT · CHN-TWN-kinetic-2027Q1` (cyan source badge)
    - `ACLED · PACOM-AO-incidents-2026` (cyan source badge)
    - `World Bank · CHN-military-expenditure-2026` (amber source badge)
    - `FRED · TWN-export-semiconductor-2026` (amber source badge)
    - `UN Comtrade · CHN-TWN-trade-flow-Q4-2026` (amber source badge)

- **User Actions:**
  - Click close button to dismiss the card
  - Click a `CitationChip` to copy the source reference to clipboard (toast confirmation)
  - Press Escape to close
  - The card does not navigate away from the current screen

- **Navigation:**
  - Opened from `EventPill` click in the `EventTimeline`
  - Opened from red-line item click in `AgentDrawer`
  - Closes back to the previous state (timeline or drawer) on dismiss

---

### Component Inventory

All components are React functional components with TypeScript prop interfaces. Tailwind CSS for all styling. No CSS modules, no styled-components.

| Component | Description | Key Props |
|---|---|---|
| `Button` | Primary and secondary action buttons. Variants: primary (cyan fill), ghost (transparent + border), destructive (red). Sizes: sm, md, lg. | `variant`, `size`, `disabled`, `loading`, `onClick`, `children` |
| `IconButton` | Square icon-only button. Used for close, expand, collapse. Sizes: sm, md. | `icon`, `size`, `label` (aria), `onClick`, `disabled` |
| `ScenarioInput` | Multiline textarea for scenario text. Dark background, monospace font, resize-none, 4–6 rows. Shows character count. | `value`, `onChange`, `placeholder`, `maxLength`, `disabled` |
| `PresetCard` | Clickable card for a preset scenario. Shows title, subtitle (agent count / turn count / est. time), domain tags, and a "Coming Soon" state. | `title`, `subtitle`, `domains`, `isComingSoon`, `isSelected`, `onClick` |
| `PlaybackControls` | Row of playback action buttons (Pause, Resume, Abort). Only rendered when `simStatus` is `running` or `paused`. | `simStatus`, `onPause`, `onResume`, `onAbort` |
| `TurnScrubber` | Horizontal range input styled as a tick-mark timeline. Shows completed turns as filled ticks. | `currentTurn`, `totalTurns`, `completedTurns`, `onChange` |
| `CountryNode` | HTML overlay label anchored to a globe lat/lng position. Shows flag + ISO code. Has a radial CSS glow animation driven by `activityLevel`. | `isoCode`, `flag`, `countryName`, `activityLevel` (0–1), `isSelected`, `onClick` |
| `AgentDrawer` | Right-side slide-in panel. Contains drawer header, posture badge, red-lines section, decisions section. Controlled open/close. | `country`, `agentState`, `isOpen`, `onClose` |
| `RedLineItem` | Single row in the red-lines list. Shows status dot (green/amber/red), label text, and optional event link. | `label`, `status` (`clear` / `near` / `crossed`), `triggeredByEventId`, `onEventClick` |
| `DecisionRow` | Single row in the recent-decisions list. Expandable to show `reasoningTrace` text. | `turn`, `actionLabel`, `reasoningTrace`, `isExpanded`, `onToggle` |
| `EventPill` | Compact event pill for the timeline track. Shows domain color indicator, actor → target, action verb. Highlighted state when country is selected in drawer. | `event`, `isHighlighted`, `onClick` |
| `EventDetailCard` | Floating/inline card with full event details: header, actor→target, action, rationale, citations. | `event`, `onClose` |
| `DomainBadge` | Small pill showing domain name with domain color background (10% opacity) and text/border in domain color. | `domain` (`cyber` / `economic` / `info` / `kinetic`), `size` |
| `CitationChip` | Compact chip for a data source citation. Source name is a colored badge prefix; reference text follows. Clickable (copies ref). | `source`, `reference`, `onCopy` |
| `TimelineTrack` | Horizontally scrollable container for `EventPill` components, grouped by turn with divider labels. | `events`, `currentTurn`, `selectedDomain`, `selectedCountryIso` |
| `Loader` | Full-canvas loading overlay used while sim is initializing. Center element: three concentric pulse rings (CSS animation) in cyan with "Initializing simulation..." label. | `message` |
| `ErrorBoundaryCard` | Centered card shown when a critical component fails to render. Shows error summary and a "Reload" button. | `error`, `onRetry` |
| `EmptyState` | Centered message for panels/tracks with no data yet. Icon + headline + optional subtext. | `icon`, `headline`, `subtext` |

---

### User Flows

#### Flow 1: First load → pick preset → simulate

1. User opens the app at `localhost:3000` (or deployed URL). Globe renders centered on the Pacific with 10 country nodes glowing softly. Left sidebar shows `ScenarioComposer` with preset cards. Bottom dock shows a thin collapsed event bar labeled "EVENTS · 0".
2. User sees "China–Taiwan 2027" as the first `PresetCard`. Clicks it. The textarea auto-fills with the preset scenario text. The globe smoothly re-orients to center on the Taiwan Strait. The 10 country nodes brighten slightly to indicate they are the active agents.
3. User clicks the "Simulate" primary button. Button enters a loading state (spinner). The `Loader` overlay appears on the globe canvas with three pulse rings and the message "Initializing simulation...".
4. Simulation begins streaming. Loader fades out. The first `SimEvent` arrives: a pulse arc animates from CHN to TWN in coral-red. The EventTimeline dock briefly flashes "1 new event" and the event count badge increments to 1.
5. Over the next 30–60 seconds, arcs animate across the globe as events stream in. `PlaybackControls` and `TurnScrubber` appear in the sidebar. Turn counter in the canvas corner increments each turn.
6. Simulation completes. `PlaybackControls` show a "Complete" status. Turn scrubber shows all 20 turns filled.

#### Flow 2: Scrub through turns during or after simulation

1. User is viewing a running simulation (or a completed one). `TurnScrubber` is visible in the sidebar with ticks for each turn.
2. User clicks or drags the scrubber handle to Turn 4. Globe state rewinds to Turn 4: arcs from turns 5–20 disappear; active arcs for Turn 4 re-animate. `EventTimeline` scrolls to the Turn 4 group.
3. User clicks the Turn 7 tick mark. Globe fast-forwards. Timeline scrolls to Turn 7 group.
4. User clicks "Resume" in `PlaybackControls` to resume live playback from the current scrubber position.

#### Flow 3: Click a country → read agent state → close

1. User clicks the CHN node on the globe. The `AgentDrawer` slides in from the right (180ms cubic-bezier ease). Globe re-centers slightly left to keep CHN visible.
2. Drawer shows: 🇨🇳 China (CHN) header, posture badge "Escalatory" (coral-red), four red-line items (two green, one amber, one red), and the five most recent decisions.
3. User clicks the Turn 7 `DecisionRow` to expand it. Reasoning trace expands inline with a smooth height animation.
4. User clicks the crossed red-line item (red status). `EventDetailCard` opens for `EVT-007` showing the event that triggered it.
5. User presses Escape. `EventDetailCard` closes. User clicks the X button on the drawer. Drawer slides out. Globe re-centers.

#### Flow 4: Click an event pill → read rationale + citations

1. User clicks the bottom dock toggle bar. `EventTimeline` expands upward (the globe canvas shrinks proportionally). Timeline shows all events grouped by turn.
2. User clicks the "KINETIC" domain filter tab. Non-kinetic pills fade to 30% opacity; kinetic pills remain full opacity.
3. User clicks the `CHN → TWN Naval Quarantine Declared` pill (Turn 3, coral-red). `EventDetailCard` appears inline above the pill, anchored by an upward pointer/caret.
4. User reads the rationale paragraph and five `CitationChip` items. Clicks the `GDELT` chip — a toast appears: "Citation copied to clipboard".
5. User clicks the X on the card. Card fades out. Timeline returns to normal state.

#### Flow 5: Edit scenario manually → resimulate

1. User has just watched a completed simulation. The globe shows the final state of Turn 20.
2. User clicks into the `ScenarioInput` and edits the text: changes "naval quarantine" to "missile strikes on Kinmen Islands".
3. User clicks "Simulate". A confirmation dialog appears: "This will replace the current simulation. Continue?" with "Cancel" and "Simulate" buttons.
4. User clicks "Simulate". Previous simulation state clears: arcs disappear, globe resets to baseline glow levels, EventTimeline clears to 0 events, Loader appears.
5. New simulation runs with the edited scenario. New pulse arcs animate with a more kinetic-heavy pattern reflecting the escalated scenario.

---

### Responsive Behavior

**Desktop (min-width: 1280px) — primary target:**
- Full layout: left sidebar (320px fixed) + globe (fills remaining width) + right drawer (360px, pushes globe or overlays).
- Bottom dock expands to 240px tall when open, globe shrinks proportionally.
- All components render at full fidelity. Pulse arcs visible at full quality.

**Tablet (min-width: 768px, max-width: 1279px):**
- Left sidebar collapses to an icon rail (48px) by default; a tab or swipe gesture expands it as a full-height overlay panel (does not push globe).
- Right `AgentDrawer` becomes a full-screen bottom sheet overlay (slides up from bottom, 80vh) instead of a side panel.
- `EventTimeline` dock still works; pills may wrap to two rows when expanded.
- Globe fills full viewport width. Touch drag to rotate globe is supported.
- `TurnScrubber` uses larger touch targets (min 44px hit area).

**Mobile (max-width: 767px) — out of scope for v1:**
- Do not crash. Render a centered `EmptyState`-style interstitial card: "Swarm is optimized for desktop (1280px+). Please open on a larger screen for the full experience." Card sits on top of a blurred/darkened globe background. No interactive sim controls rendered.

---

### Export Preferences

- **Format:** React components with Tailwind CSS. Next.js 14 App Router compatible (no `"use client"` directives unless component uses browser APIs or event handlers — follow the App Router conventions).
- **Include:**
  - TypeScript prop interfaces for every component (exported as named types from the component file)
  - Responsive breakpoints using Tailwind's `sm:`, `md:`, `lg:`, `xl:` prefixes (do not use arbitrary values for breakpoints)
  - Dark mode hardcoded (no `dark:` prefix needed — the app is always dark; use direct color classes)
  - Component file naming: PascalCase matching the component name (e.g., `AgentDrawer.tsx`)
  - All colors as Tailwind config extension values (define the domain palette in `tailwind.config.ts` under `theme.extend.colors`) — no raw hex in className strings
  - Animation utilities for the pulse glow and arc effects defined as custom Tailwind `keyframes` + `animation` entries in config
  - Geist font loaded via `next/font/google` in `app/layout.tsx`
