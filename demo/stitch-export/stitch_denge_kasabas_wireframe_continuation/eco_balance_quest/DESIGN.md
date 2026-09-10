---
name: Eco Balance Quest
colors:
  surface: '#f7f9ff'
  surface-dim: '#cadcf2'
  surface-bright: '#f7f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4ff'
  surface-container: '#e4efff'
  surface-container-high: '#d9eaff'
  surface-container-highest: '#d2e4fb'
  on-surface: '#0b1d2d'
  on-surface-variant: '#40484c'
  inverse-surface: '#213243'
  inverse-on-surface: '#e9f1ff'
  outline: '#70787d'
  outline-variant: '#bfc8cd'
  surface-tint: '#1e667f'
  primary: '#004357'
  on-primary: '#ffffff'
  primary-container: '#0d5c75'
  on-primary-container: '#93d3ef'
  inverse-primary: '#90cfec'
  secondary: '#006d3b'
  on-secondary: '#ffffff'
  secondary-container: '#98f7b5'
  on-secondary-container: '#01743f'
  tertiary: '#633000'
  on-tertiary: '#ffffff'
  tertiary-container: '#864300'
  on-tertiary-container: '#ffbc8d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#bde9ff'
  primary-fixed-dim: '#90cfec'
  on-primary-fixed: '#001f2a'
  on-primary-fixed-variant: '#004d64'
  secondary-fixed: '#98f7b5'
  secondary-fixed-dim: '#7cda9b'
  on-secondary-fixed: '#00210e'
  on-secondary-fixed-variant: '#00522b'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#ffb783'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#713700'
  background: '#f7f9ff'
  on-background: '#0b1d2d'
  surface-variant: '#d2e4fb'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.005em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-xxs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  space-3xl: 4rem
  container-max: 1200px
  gutter-desktop: 1.5rem
  gutter-tablet: 1rem
  gutter-mobile: 0.75rem
---

## Brand & Style

This design system establishes an exploratory, intelligent, and grounded digital environment for middle-school learners aged 10–12. The brand personality balances scientific discovery with approachable warmth: it feels like an interactive nature-tech field station rather than an entertainment arcade or an institutional textbook. The visual aesthetic deliberately rejects both juvenile preschool motifs (oversized primary blobs, exaggerated bouncy shapes) and overstimulating neon gamification (high-frequency glows, aggressive dark-mode arcade styling).

The core design style merges **Modern Eco-Tech** with **Tactile Utility**:
- **Structured Wonder:** Architectural clarity inspired by environmental monitoring dashboards, clean simulation tools, and nature guides.
- **Dignified Agency:** Treats young adolescents as capable researchers, strategists, and town planners who value legible data, clear feedback, and purposeful interaction.
- **Physical Substance:** Softly sculpted, pillowed interactive elements that invite touch and deliberate decision-making without clutter or visual noise.

## Colors

The color architecture communicates environmental stability, intellectual calm, and measured optimism. The default system state is light, leveraging high natural daylight contrast with atmospheric sky-tinted neutrals.

### Palette Architecture
- **Primary (`#0D5C75` deep teal, `#083E50` deep navy-teal):** Anchor shade for core navigation bars, primary structural framing, commanding callouts, and decisive user actions.
- **Secondary (`#1E824C` forest moss, `#2ECC71` vitality green, `#E8F5E9` field wash):** Applied to ecological balance indicators, growth metrics, regenerative rewards, and natural resource trackers.
- **Tertiary / Accent (`#E67E22` warm amber, `#F39C12` honey gold, `#FEF3E2` sun wash):** Reserved exclusively for alerts, interactive highlights, unlocked milestones, and current-turn focal points.
- **Neutrals & Surfaces:**
  - Background: `#F4F7F9` (sky-tinted gray) establishes an expansive atmospheric field that prevents eye strain during extended classroom or home play.
  - Surface Containers: `#FFFFFF` provides crisp focus for game cards, modal dialogues, and resource dashboards.
  - Borders: `#E2E8F0` defines clean mechanical enclosures.
  - Text Hierarchy: `#1A2B3C` (headline navy) for maximum legible punch, `#334E68` (slate charcoal) for body descriptions, and `#627D98` (dusty denim) for supplementary metadata.

## Typography

Typography prioritizes fast information scanning and effortless comprehension for late-elementary and early-middle-school readers. **Plus Jakarta Sans** provides a warm geometric structure with rounded terminals, high x-height, and open apertures that maintain extreme clarity across tablet and desktop displays.

### Rules for Application
- **Generous Leading:** Body copy always maintains a minimum 1.5× to 1.6× line-height ratio to prevent visual tracking exhaustion during story-based dialogue or ecological problem briefs.
- **Tabular Numerics:** For resource counts, energy points, and balance gauges, numerals must be rendered with `font-variant-numeric: tabular-nums` to eliminate jitter during real-time value updates.
- **Hierarchy Restraint:** Avoid stacking more than two weights in a single card module. Use uppercase styling solely on `label-sm` or `label-md` badge elements paired with slight letter spacing (`0.02em` to `0.03em`) for structural legibility.

## Layout & Spacing

The system runs on an 8pt base grid with a 4pt micro-subgrid for precise alignment of badges, icons, and progress meters.

### Grid & Responsiveness
- **Desktop (1024px+):** Centered fixed-fluid 12-column layout capped at `1200px` maximum width. Standard gutters are `1.5rem` (`24px`). Side panels (town resources, balance telemetry) dock to a 4-column span, leaving 8 columns for interactive town simulation viewports.
- **Tablet (768px – 1023px):** 8-column layout with `1rem` (`16px`) gutters. Side controls collapse into contextual horizontal ribbons docked along the screen perimeter.
- **Mobile (Below 768px):** 4-column single-flow layout with `0.75rem` (`12px`) gutters and minimum `16px` safe margin boundaries. Game HUD elements consolidate into bottom sheets and sticky top resource strips.

### Touch Target Integrity
All tap targets adhere to a strict minimum physical size of `44px × 44px` (`48px × 48px` preferred for gameplay control buttons) to accommodate varying degrees of fine motor control on touchscreens.

## Elevation & Depth

Visual depth is achieved through **multi-layered ambient lighting** and **tactile physics** rather than dark, heavy drop shadows or harsh outline borders.

### Depth Scales
- **Level 0 (Flat Ground):** Background `#F4F7F9` and sunken input wells. Well surfaces employ an inset shadow: `inset 0 2px 4px rgba(8, 62, 80, 0.04)` with a `#E2E8F0` hairline boundary.
- **Level 1 (Card & Module Foundation):** Resting game cards and dashboard containers. Pure `#FFFFFF` surface with a delicate outer border (`1px solid #E2E8F0`) and an ambient tinted shadow: `0 4px 16px -2px rgba(13, 92, 117, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03)`.
- **Level 2 (Interactive Hover / Focus State):** Cards under active inspection and secondary dialogue bubbles. Elevated ambient shadow: `0 10px 25px -4px rgba(13, 92, 117, 0.10), 0 2px 6px -1px rgba(13, 92, 117, 0.04)`. Card transforms `translateY(-2px)`.
- **Level 3 (Tactile Push Physics for Buttons):** Buttons do not use blurry shadows; they feature an extruded solid bottom bezel (`0 4px 0 #083E50` for primary actions). On click or press, the element shifts down `2px` while reducing the bottom extrusion to `2px`, delivering real-world tactile feedback without distracting skeuomorphic clutter.
- **Level 4 (Modals & Overlays):** Full overlays and quest accomplishment sheets: `0 20px 40px -10px rgba(8, 62, 80, 0.18)` resting over a `rgba(8, 62, 80, 0.40)` backdrop with a `4px` blur.

## Shapes

The shape vocabulary uses generous curvature to maintain friendly, inviting accessibility while retaining geometric discipline. 

- **Containers & Cards:** Styled with `rounded-2xl` (`16px`) to `rounded-3xl` (`24px`). This softens sharp corners, making complex town stats feel digestible and safe to explore.
- **Interactive Controls (Buttons, Inputs, Metric Badges):** Standardized with `rounded-xl` (`12px`) for form elements, scaling to full pill shapes (`rounded-full`) for resource indicators, notification chips, and toggle switches.
- **Game Tiles & Map Overlays:** Styled at `rounded-2xl` (`16px`) with matching interior nested child radii calculated at `parent_radius - padding_offset` to prevent visual tension.

## Components

### 1. Navigation Top Bar
- **Structure:** Anchored `#FFFFFF` or `#083E50` solid surface with a subtle lower divider border. Height: `64px`.
- **Left Wing:** Game identity and level badge (pill-shaped `#E8F5E9` container with `#1E824C` bold text).
- **Center Track:** Town balance gauge (dual-color segmented eco/tech ratio bar with smooth ease transitions).
- **Right Wing:** Resource pills displaying Energy, Water, and Community Happiness counts with dedicated SVG icons and tabular numeric counters.

### 2. Tactile Buttons
- **Primary ("Take Action" / "Build"):** Background `#0D5C75`, text `#FFFFFF`, solid shadow lip `0 4px 0 #083E50`. Border radius: `12px` or pill. Hover triggers a subtle brightness increase; active state triggers `translateY(2px)` with `0 2px 0 #083E50`.
- **Secondary ("Explore" / "Inspect"):** Background `#E8F5E9`, text `#1E824C`, border `1.5px solid #2ECC71`, soft shadow lip `0 3px 0 rgba(30, 130, 76, 0.25)`.
- **Accent ("Upgrade" / "Claim Reward"):** Background `#E67E22`, text `#FFFFFF`, solid shadow lip `0 4px 0 #B95E0E`.

### 3. Resource & Status Chips
- **Geometry:** Height `32px`, pill-shaped (`rounded-full`), horizontal padding `12px`.
- **Colorways:** Eco-positive uses `#E8F5E9` with `#1E824C` text and icon; warning uses `#FEF3E2` with `#E67E22` text. Icon diameter is fixed at `16px` with `6px` right spacing to text.

### 4. Quest & Town Decision Cards
- **Container:** Pure `#FFFFFF` surface with `1px solid #E2E8F0`, corner radius `20px`, padding `20px`.
- **Header:** Category eyebrow in `label-sm` uppercase teal, title in `headline-sm` navy, close or help button aligned right.
- **Body:** `body-md` typography with bulleted outcome predictions (e.g., "+15 Clean Water / -5 Town Energy").
- **Footer:** Action container with primary decision button and a neutral outline cancel button (`1px solid #E2E8F0`, text `#334E68`).

### 5. Input Fields & Toggles
- **Inputs:** Height `44px`, corner radius `12px`, background `#FFFFFF`, border `1.5px solid #E2E8F0`, focus state transitions to `1.5px solid #0D5C75` with a diffuse `0 0 0 3px rgba(13, 92, 117, 0.15)` halo.
- **Toggles:** Pill track (`48px × 28px`), inactive state `#E2E8F0`, active state `#1E824C`. Thumb is `#FFFFFF` with a `24px` circle diameter and subtle drop shadow.

### 6. Balance & Progress Meters
- **Track:** Height `12px` to `16px`, background `#F4F7F9` with inner border `1px solid #E2E8F0`, fully rounded edges (`rounded-full`).
- **Fill:** Bi-directional indicator (Eco vs. Industry) using vibrant smooth gradients from `#1E824C` to `#2ECC71` or `#0D5C75` to `#334E68`, with an animated equilibrium marker at the target center line.