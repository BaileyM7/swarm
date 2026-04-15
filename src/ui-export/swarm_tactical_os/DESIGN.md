# Design System Strategy: Situational Intelligence & Tactical Depth

## 1. Overview & Creative North Star
**The Creative North Star: "The Silent Sentinel"**

This design system is engineered for high-stakes, defense-grade decision-making where cognitive load must be managed through extreme visual precision. Moving beyond standard dark-mode templates, this system adopts an **"Intelligence Editorial"** aesthetic—fusing the raw, data-dense utility of a Bloomberg Terminal with the surgical, high-end polish of a modern productivity suite.

The experience is defined by **Intentional Density.** We do not fear information; we organize it through a rigorous hierarchy of light and texture. By utilizing a "Tactical Layering" approach, we create a sense of focused immersion, where the UI recedes into the background to let the telemetry speak, but responds with "Cyber" (#5bc9ff) vibrance the moment action is required.

---

## 2. Colors & Surface Logic

The palette is rooted in a "Deep Space" philosophy, utilizing `surface-container` tiers to create a sense of instrument-panel depth.

### Color Roles
- **Cyber (Primary):** `#5bc9ff` — Used for active states, primary actions, and "Friendly" entity markers.
- **Kinetic (Error):** `#ff5c7a` — Reserved for high-alert threats, kinetic engagements, and critical system failures.
- **Economic:** `#f5a623` — Used for trade, logistics, and secondary warnings.
- **Info/Diplomatic:** `#a78bfa` — Used for non-hostile intelligence and soft-power metrics.

### The "No-Line" Rule & Surface Hierarchy
While the original aesthetic utilizes a 1px border, these must be treated as **"Ghost Borders."** They are not structural dividers; they are light-catching edges.
- **Surface Nesting:** Hierarchy is achieved by stacking. A `surface-container-highest` panel should never sit directly on the `background`. It must be nested within a `surface-container-low` transition to mimic the physical assembly of a cockpit console.
- **The Glass & Gradient Rule:** For floating HUD elements or modal overlays, use **Glassmorphism.** Apply `surface-container-highest` at 60% opacity with a `20px` backdrop-blur. 
- **Signature Texture:** Every primary surface must feature a `subtle film-grain texture` (Overlay, 3% opacity) to eliminate "banding" and provide a tactile, analog feel to the digital glass.

---

## 3. Typography: The Geist Protocol

Typography is split between human-readable UI and machine-precise telemetry.

- **Display & Headline (Geist Sans):** Used for high-level situational titles. These should feel authoritative. Use `tracking: -0.02em` for headlines to create a "compressed" tactical look.
- **Body & UI (Geist Sans):** Weights 400 (Regular) and 500 (Medium). This is for navigation and descriptive intelligence.
- **Telemetry & Data (Geist Mono):** Every coordinate, timestamp, and numeric value **must** use Geist Mono. This ensures that data columns align perfectly in dense tables, allowing the eye to scan for anomalies without the "jitter" of proportional fonts.

---

## 4. Elevation & Depth: Tonal Layering

In a "defense-grade" console, traditional drop shadows are prohibited as they suggest a light source that doesn't exist in a dark room. Instead, we use **Tonal Lift.**

- **The Layering Principle:** 
    - `background` (#0a0e1a): The base void.
    - `surface-container-low`: Main workspace area.
    - `surface-container-high`: Individual modules/widgets.
    - `surface-container-highest`: Active/focused elements.
- **Ghost Borders:** Use `outline-variant` (#3e484f) at 12% opacity. This creates a "specular highlight" on the edge of a panel, simulating a 1px chamfered edge on hardware.
- **Ambient Glow:** For critical nodes, use a "Pulse Glow." Instead of a shadow, use a `0px 0px 12px` outer glow using the node's specific category color (e.g., Kinetic Coral) at 30% opacity.

---

## 5. Components

### Buttons & Inputs
- **Primary Action:** Solid `primary` (#5bc9ff) with `on-primary` (#003549) text. No rounded corners (`0px`).
- **Tactical Inputs:** Text fields use `surface-container-lowest` backgrounds. Focus states are indicated by a `1px` Cyber-cyan top-border only, mimicking a terminal cursor.

### Chips & Status Indicators
- **Data Chips:** Small, mono-spaced labels. Use `outline-variant` for the border.
- **Alert States:** Use the Kinetic (#ff5c7a) or Economic (#f5a623) colors. These should feature a 1px interior "breathing" pulse animation to draw the eye without disrupting the layout.

### Lists & Tables (The "Bloomberg" Standard)
- **Zero Dividers:** Forbid the use of horizontal lines between rows. Use a 4px vertical gap or a subtle `surface-container-low` background hover state to define rows.
- **Density:** Reduce padding to the absolute minimum required for legibility. Data is the priority.

### Custom Component: The Arc & Pulse
- **Visual Arcs:** When connecting nodes, use a 1px stroke. Use a "Traveling Light Pulse"—a small, high-intensity segment of the line that moves from Origin to Destination to indicate data flow.

---

## 6. Do’s and Don’ts

### Do:
- **Do** maintain a strict `0px` border radius across all components.
- **Do** use Geist Mono for any element that changes rapidly (counters, coordinates).
- **Do** use "Optical Alignment"—ensure icons with 1.5px strokes feel centered even if they are mathematically off.
- **Do** utilize the film-grain texture to give "weight" to the dark surfaces.

### Don’t:
- **Don’t** use standard "Material Design" blue (#2196F3). Only use the specified Cyber Cyan (#5bc9ff).
- **Don’t** use 100% opaque borders. They create "visual cages" that trap the user's eye.
- **Don’t** use large, soft shadows. If an element needs to float, use a subtle 10% opacity glow of its own color.
- **Don’t** use "rounded" or "bubbly" icons. Every icon must feel like it was plotted on a grid.