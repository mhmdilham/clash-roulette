# Design Document — Clash of Clans Attack Spin

**Date:** 2026-11-24  
**Status:** Ready for User Approval (Passed Builder Check)  
**Target Workspace:** `c:\Users\Ilham\Documents\vibe\vibe_coding\coc\atk_spin`

---

## 1. Intent & Why

Build a standalone, modern **Clash of Clans Attack Spin** web application inspired by [Clasher Pro Troop Spin](https://clasher.pro/labs/coc-troop-spin), upgraded with up-to-date Clash of Clans content (up to **Town Hall 19**, including **Dragon Duke** and his equipment, **Greedy Raven**, **Heroic Spell**, **Ruin Witch**, **Meteor Golem**, **Furnace**, **Thrower**, **Totem Spell**, **Super Yeti**, **Stick Horse**, etc.) and smarter spinning mechanics.

### Primary Users & Use Cases
1. **Personal experimentation / solo practice:** Fast, low-friction wheel spinning to invent fresh attack armies, test off-meta combinations, re-spin individual slots without resetting everything, and auto-persist preferences in the browser.
2. **Clan & friends challenges:** Fair, rule-aware loadout generation (TH-accurate hero/pet/equipment limits, anti-duplicate, lockable slots) with one-click **Copy Text** and **Export Loadout Card (PNG)** for sharing directly to WhatsApp, Discord, or clan chat.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- **Up-to-date TH1–TH19 dataset:** Cover all 7 core categories (**Troops**, **Super Troops**, **Siege Machines**, **Spells**, **Heroes**, **Equipment**, **Pets**) with accurate Town Hall unlock thresholds and maintainable pure-TypeScript data modules.
- **Multi-role Troop filtering:** Allow every Troop and Super Troop to carry multiple tactical roles (`Main`, `Support`, `Tank`, `Damage Dealer`, `Funnel`, `Clean-up`) plus movement type (`Ground` / `Air`), with free ON/OFF toggling (`All OFF` = pure random, plus `OR` / `AND` matching).
- **Bidirectional Hero ↔ Equipment relevance:** Spinning Heroes first automatically filters the Equipment wheel to equipment owned by selected Heroes (default ON, toggleable OFF); spinning Equipment first automatically filters the Hero wheel to Heroes who own those equipment pieces (default ON, toggleable OFF).
- **Town Hall–accurate slot caps:** Enforce real in-game Hero, Pet, Equipment (2 per Hero), and Super Troop (2 max) slot limits based on the selected Town Hall, with a toggle to relax limits if desired.
- **Responsive, fast, authentic UX:** Smooth 60fps SVG spinning wheel (Normal & Fast Spin), Web Audio API spin sound effects, local CoC unit portraits with graceful SVG badge fallback, per-slot re-spin/remove/lock, and instant share/export.

### Non-Goals
- No backend server, database, user accounts, or real-time multiplayer rooms.
- No full housing-space army capacity calculator or troop-count optimizer (this is a spin/randomizer tool, not a full Army Recipe builder).
- No TH19 **Squads** category in v1 (explicitly deferred; v1 focuses on the 7 core categories).
- No streaming/OBS-specific "Stream Mode" overlay or dramatic fullscreen reveal theater.

### Anti-Goals (What would make this a failure even if it works)
- **Dead-end / empty wheel traps:** Filter combinations (e.g., Hero↔Equipment relevance ON after all relevant heroes are already picked, or strict `AND` role filters matching 0 troops) must NEVER leave the user confused with a broken wheel; the UI must clearly explain why the pool is empty and offer a 1-click recovery action.
- **Stale / hard-coded game data:** Game units, TH unlocks, and Hero↔Equipment mappings must never be scattered inside UI components; adding a future TH20 unit or new Epic equipment must only require editing structured data files in `src/data/`.
- **Broken external images:** Relying on hotlinked third-party image URLs that fail with 403/404 or break offline.

---

## 3. Constraints

- **100% client-side static web app:** Must build to static files deployable on Vercel, Netlify, Cloudflare Pages, or GitHub Pages with zero backend runtime.
- **Offline-safe asset handling:** CoC unit portraits stored locally in `public/assets/coc/` (populated via a reproducible asset-fetch script during build/dev) with an automatic styled SVG badge fallback whenever an image is missing or fails to load.
- **Mobile & Desktop usable:** Friends in a clan frequently open shared links on mobile phones; controls, wheel, and loadout summary must work smoothly on narrow viewports as well as desktop two-column layouts.
- **Language convention *(Author's call)*:** All Clash of Clans item names, categories, and tactical role tags use official English game terminology (`Barbarian King`, `Dragon Duke`, `Root Rider`, `Fire Heart`, `Main`, `Support`, `Tank`, `Damage Dealer`, `Funnel`, `Clean-up`) so CoC players recognize them instantly; UI chrome defaults to clean **Bahasa Indonesia** (matching the user's language) with an optional simple `ID / EN` toggle if desired, or clean Indonesian labels with English CoC terms throughout *(v1 default: Indonesian UI labels + official English CoC names/terms)*.

---

## 4. Approaches Considered & Chosen

Four implementation approaches were evaluated:

1. **Vite + Svelte 5 + TypeScript + Tailwind CSS (Static SPA) — CHOSEN**
   - *How it works:* Svelte 5 runes (`$state`, `$derived`, `$effect`) manage layered filter state, bidirectional Hero↔Equipment linking, TH slot limits, and `localStorage` persistence. Pure TypeScript engine (`src/engine/`) and data (`src/data/`) stay decoupled from UI and fully unit-tested with Vitest. Custom SVG wheel runs via `requestAnimationFrame`; audio uses Web Audio API; PNG export uses `html-to-image`.
   - *Trade-offs:* Smaller third-party component ecosystem than React, slight learning curve if manually editing Svelte 5 syntax later — mitigated because this app relies on web standards rather than heavy UI libraries.
   - *Why chosen:* Best fit for heavy derived-state filtering + smooth SVG animations + built-in UI transitions + smallest mobile bundle size. Confirmed by user.

2. **Vite + React + TypeScript + Tailwind CSS (Static SPA)**
   - *Trade-offs:* Larger ecosystem and wider familiarity, but more boilerplate (`useMemo`/`useCallback`/`useRef`) to avoid stale closures in `requestAnimationFrame` wheel loops and requires an extra library for UI transitions.

3. **Next.js (App Router) + TypeScript + Tailwind CSS**
   - *Trade-offs:* Ready for future backend/accounts/multiplayer rooms, but unnecessarily heavy for a pure client-side tool and adds build/deployment overhead.

4. **Vanilla HTML + JS + CSS (No Build Tool)**
   - *Trade-offs:* Zero setup, but managing 7 categories × multi-role OR/AND filters × bidirectional Hero↔Equipment linking × TH slot caps × per-slot re-spin without TypeScript or reactive primitives becomes fragile and error-prone.

---

## 5. Functional & Behavioral Specification

### 5.1 Town Hall Selector & Category Availability
- Dropdown selector supporting **Town Hall 1 through Town Hall 19** (default: **Town Hall 19**).
- Categories dynamically show/hide (or disable with unlock tooltip) based on whether at least 1 item is unlocked at the chosen Town Hall:
  - **Troops:** TH1+
  - **Spells:** TH5+
  - **Heroes:** Unlocked starting at first Hero unlock TH (exact Hero Hall TH thresholds verified against Clash of Clans Wiki during data authoring; see Section 5.4)
  - **Equipment:** Unlocked starting at Blacksmith TH (TH8+)
  - **Super Troops:** TH11+
  - **Siege Machines:** TH10+ when **`Termasuk Donasi CC (TH10+)`** is ON (default ON — Clan Castle Lv6+ at TH10 can receive any donated Siege Machine, so all Siege Machines are available across TH10–TH19). When toggled OFF, filters strictly by official Workshop `unlockTh` (TH12–TH16+ self-crafted Siege Machines only).
  - **Pets:** TH14+ (Pet House)
- **Changing Town Hall behavior *(Author's call)*:** When the user lowers the Town Hall, any already-picked items in the current loadout that are locked at the new TH (or exceed the new TH's Hero/Pet slot cap) are automatically pruned, and a non-intrusive toast/banner notifies what was removed. Raising the Town Hall keeps the existing loadout intact.

### 5.2 Categories & Up-to-Date TH19 Dataset
All 7 categories from Clasher Pro, updated to late-2026 **TH19** content (every item verified against official CoC Wiki during implementation):
1. **Troops (Elixir & Dark Elixir):** All standard troops through TH19 including `Meteor Golem`, `Thrower`, `Root Rider`, `Electro Titan`, `Dragon Rider`, `Apprentice Warden`, `Druid`, `Furnace`, `Ruin Witch`, etc.
2. **Super Troops:** All 17+ Super Troops through TH19 including `Super Yeti`, `Super Hog Rider`, `Super Miner`, `Super Bowler`, `Super Dragon`, `Inferno Dragon`, `Super Witch`, `Super Valkyrie`, `Ice Hound`, `Rocket Balloon`, `Sneaky Goblin`, `Super Wall Breaker`, `Super Wizard`, `Super Minion`, `Super Archer`, `Super Giant`, `Super Barbarian`, plus any newer 2026 Super Troops verified on Wiki.
3. **Siege Machines:** All 8+ Siege Machines (`Wall Wrecker`, `Battle Blimp`, `Stone Slammer`, `Siege Barracks`, `Log Launcher`, `Flame Flinger`, `Battle Drill`, `Troop Launcher`, plus any newer 2026 addition).
4. **Spells (Elixir & Dark):** All Elixir & Dark Spells through TH19 including `Heroic Spell`, `Totem Spell`, `Ice Block Spell`, `Revive Spell`, `Overgrowth Spell`, `Recall Spell`, plus classics.
5. **Heroes (6):** `Barbarian King`, `Archer Queen`, `Minion Prince`, `Grand Warden`, `Royal Champion`, `Dragon Duke`.
6. **Hero Equipment:** All Common & Epic equipment for all 6 heroes through TH19, including **Dragon Duke** equipment (`Fire Heart`, `Flame Blower`, `Stun Blaster`, `Rocket Backpack`, `Electro Fangs`, etc.), **Minion Prince** (`Dark Orb`, `Henchmen Puppet`, `Metal Pants`, `Noble Iron`, `Dark Crown`, `Meteor Staff`, `Portal Pendant`, etc.), **Barbarian King** (`Stick Horse`, `Snake Bracelet`, `Spiky Ball`, `Giant Gauntlet`, etc.), **Archer Queen** (`Action Figure`, `Magic Mirror`, `Monolith Arrow`, `Frozen Arrow`, etc.), **Grand Warden** (`Heroic Torch`, `Fireball`, `Lavaloon Puppet`, etc.), **Royal Champion** (`Electro Boots`, `Rocket Spear`, etc.). Each equipment entry stores `heroId`, `rarity` (`common` | `epic`), and `unlockTh`.
7. **Pets (12):** `L.A.S.S.I`, `Electro Owl`, `Mighty Yak`, `Unicorn`, `Frosty`, `Diggy`, `Poison Lizard`, `Phoenix`, `Spirit Fox`, `Angry Jelly`, `Sneezy`, `Greedy Raven`.

*(Note: During data authoring, a verification pass against Clash of Clans Wiki will confirm exact item lists and `unlockTh` values for every entry so nothing from 2025–2026 updates is missed.)*

### 5.3 Troop & Super Troop Multi-Role Filter System
Applies to **Troops** and **Super Troops** tabs:
- **Multi-tag assignment:** Every Troop and Super Troop has `roles: TroopRole[]` (1 or more tags) and `movement: 'ground' | 'air'` (plus `resource: 'elixir' | 'dark'`, usable as secondary filter or badge).
- **Role Tags:**
  - `Main` (core army backbone, e.g., Root Rider, Dragon, Electro Dragon, Meteor Golem, Yeti, Super Bowler, Hog Rider)
  - `Support` (healers, buffers, utility, e.g., Healer, Apprentice Warden, Druid, Headhunter, Wall Breaker, Super Wall Breaker, Furnace)
  - `Tank` (front-line damage absorbers, e.g., Golem, Ice Golem, Giant, Lava Hound, Meteor Golem, Root Rider, Super Giant, Ice Hound, Yeti)
  - `Damage Dealer` (high DPS units, e.g., Wizard, Bowler, P.E.K.K.A, Valkyrie, Dragon, Super Archer, Super Wizard, Super Dragon, Thrower)
  - `Funnel` (edge clearing & pathing, e.g., Baby Dragon, Electro Dragon, Wizard, Super Barbarian, Valkyrie, Yeti)
  - `Clean-up` (fast trash clearing, e.g., Archer, Minion, Goblin, Sneaky Goblin, Baby Dragon, Super Barbarian, Wizard)
- **Filter Controls:**
  - Toggleable chip per role (multi-select ON/OFF).
  - **All Role Filters OFF** = Pure random across all unlocked units in that category for the selected TH.
  - **Match Mode Toggle (`OR` / `AND`):**
    - Default **`OR` (Salah Satu):** Selecting `Main` + `Support` includes any unit tagged `Main` OR `Support` (directly supports *"random main + support"*).
    - Optional **`AND` (Semua):** Selecting `Tank` + `Main` includes only units having BOTH `Tank` AND `Main`.
  - **Movement Filter (`Semua` | `Ground` | `Air`):** Optional quick filter chip group, defaults to `Semua`.
  - **Quick Reset Filters button** on the filter panel to return to pure random in 1 click.
  - **Live Pool Counter:** Displays e.g. `14 / 32 unit di roda` so the user always sees how their filters affect the wheel.

### 5.4 Town Hall–Accurate Limits & Realistic Rules Toggle
A **`Batas Realistis TH` (Realistic TH Limits)** toggle defaults to **ON** (can be turned OFF for unrestricted sandbox spinning):

| Resource | Limit When Realistic TH Limits = ON | Notes |
| :--- | :--- | :--- |
| **Active Heroes** | `min(4, unlockedHeroesAtTH)` | Reflects in-game max 4 active heroes in battle. Exact unlock count scales by TH via Hero Hall (e.g., 0 at TH1–TH3 or TH1–TH6 per verified Wiki Hero Hall rules, scaling up to max 4 active heroes even when 5–6 heroes are unlocked at TH13–TH19). |
| **Pets** | TH1–TH13: `0`. TH14+: `min(4, activeHeroLimitAtTH)` — and if Heroes are already picked, **assigned 1 Pet per Hero slot** (up to 4 total). | No duplicate pets. If Pets are spun before Heroes, they go into an unassigned Pet tray (up to 4) and auto-pair in order as Heroes are spun (with manual swap/assign support if needed, or clean slot pairing). |
| **Hero Equipment** | Max **2 Equipment per Hero** (max `2 × heroLimit` total, i.e., up to 8 at TH11+), never duplicating the same equipment on the same Hero. | Equipment always tracks its owning `heroId`. |
| **Super Troops** | Max **2 Super Troops** active at TH11+ *(Author's call: follows real CoC 2-active-Super-Troop limit; relaxed when Realistic Limits = OFF)*. | Anti-duplicate applies naturally. |
| **Siege Machines** | *(Author's call)* Default max **1 Siege Machine** when Realistic Limits = ON (since you deploy 1 Siege per attack; user can re-spin it directly or turn off limits to collect multiple). | — |
| **Troops & Spells** | No fixed count cap (users may spin 1, 3, or 5 troops/spells for a challenge). Controlled by the **Anti-Duplikat** toggle (default ON). | — |

When a capped category reaches full capacity (e.g., Heroes `4/4`), the `SPIN!` button shows a clear state (`Slot Penuh 4/4`) instead of failing silently, while the user can still **Re-spin** any individual slot in the loadout or toggle off `Batas Realistis TH`.

### 5.5 Bidirectional Hero ↔ Equipment Relevance System
A contextual toggle **`Hanya Relevan`** appears on both the **Heroes** and **Equipment** tabs, tracked with **per-direction manual override state** (`equipRelevanceOverride` and `heroRelevanceOverride`, both cleared on `Clear All` / `Reset`) so bypassing relevance in one direction never breaks relevance in the other:

- **Auto-Default Behavior:**
  - **Equipment tab (`Hero → Equipment`):** Automatically defaults to **ON** whenever ≥ 1 Hero is in the loadout (unless the user manually toggled Equipment relevance OFF).
  - **Heroes tab (`Equipment → Hero`):** Automatically defaults to **ON** ONLY when ≥ 1 **unpaired** Equipment exists in the loadout (i.e., Equipment whose owning Hero is not yet chosen), unless the user manually toggled Hero relevance OFF.
  - **Seamless `Hero #1 → Equipment → Hero #2` flow:** Once a Hero is chosen and receives their Equipment, those Equipment pieces are **paired** — so returning to the **Heroes** tab to spin Hero #2 sees zero unpaired Equipment and immediately presents all remaining unchosen Heroes without hitting an empty wheel or forcing any toggle!

- **Filtering Rules When Active:**
  1. **On the Equipment tab (when ≥ 1 Hero is chosen & Equipment relevance = ON):**
     - Pool only includes Equipment where `equipment.heroId` is in the list of **chosen Heroes**.
     - Excludes any Equipment already picked.
     - Excludes all Equipment belonging to a Hero that already has **2/2 Equipment slots filled** (when Realistic Limits = ON).
     - *Empty-pool state:* If all chosen Heroes already have 2/2 Equipment, clearly display *"Semua Hero terpilih sudah punya 2/2 Equipment"* with quick actions: `[Lanjut Spin Hero]` (if Hero slots remain) or `[Matikan Filter Relevan]`.
  2. **On the Heroes tab (when ≥ 1 unpaired Equipment exists & Hero relevance = ON):**
     - Pool only includes unchosen Heroes who own at least one currently **unpaired** Equipment.
     - *Override / escape hatch:* If the user wants to spin a different Hero instead of matching the unpaired Equipment, they can toggle Hero relevance OFF with 1 click (`Matikan Filter Relevan Hero`) without turning off Equipment-tab relevance.
  3. **When Equipment is spun with relevance OFF (or before Heroes):**
     - Equipment is stored with its `heroId`. If that Hero is later spun, matching Equipment automatically attaches under that Hero card (up to 2 slots; any excess remains in Unpaired Equipment). Equipment for Heroes not yet in the loadout is displayed cleanly in a *"Belum terpasang Hero (Unpaired)"* sub-section with the owning Hero's badge.

### 5.6 Spinning Wheel & Audio Mechanics
- **Visual Style:** Inspired by Clasher Pro's sleek dark-mode Clash aesthetic — circular SVG wheel with metallic gold rim, high-contrast dark/accent radial slices, portrait icon near the outer rim + readable angled label inward, right-side (3 o'clock) indicator pointer, and central **`SPIN!`** button.
- **Spin Physics (`requestAnimationFrame`):**
  - Cryptographically fair random target selection (`crypto.getRandomValues` or `Math.random`) mapped accurately to the pointer angle so the visual landing slice ALWAYS matches the selected result (zero off-by-one angle bugs!).
  - Smooth cubic/quartic ease-out deceleration.
  - **Speed Toggle:**
    - `Normal` (~3.5–4.2s, satisfying deceleration)
    - `Fast Spin` (~0.9–1.2s, built for quick solo experimentation!)
  - Controls (TH selector, category tabs, filters, reset) lock while spinning to prevent state corruption.
  - Idle gentle slow rotation (optional subtle motion, pauses immediately on hover/spin, respects `prefers-reduced-motion`).
- **Audio Feedback (Web Audio API):**
  - Synthesized crisp mechanical *tick* sound each time a slice boundary crosses the pointer (tempo naturally slows down with the wheel!).
  - Synthesized celebratory *chime/reveal* tone on landing.
  - Sound toggle (Mute/Unmute) + volume slider, persisted in `localStorage`. Zero external audio files required.
- **Post-Spin Reveal:**
  - Compact, punchy result toast/badge right next to/below the wheel showing the newly landed unit (icon, name, role tags or owner hero) + immediate insertion into the Loadout Summary below, with a quick `Re-spin` undo option right on the reveal banner.

### 5.7 Loadout Summary, Slot Controls & Sharing (Personal + Clan Challenge)
Positioned cleanly below (or beside on ultra-wide screens) the wheel:
- **Structured Loadout View:**
  - **Heroes & Companions section:** Displays slots up to TH cap (e.g. `2/4`), each Hero card cleanly showing:
    - Hero portrait & name
    - Its **2 Equipment slots** (filled or empty placeholder)
    - Its **1 Pet slot** (shown for TH14+, filled or empty placeholder)
    - Unpaired Equipment / Unpaired Pets (if spun before Heroes) shown in a neat holding row until paired.
  - **Army & Support sections:** Grouped chips/cards for **Troops** (showing role badges), **Super Troops** (`x/2`), **Spells**, and **Siege Machine** (`x/1`).
- **Per-Slot Actions (built for solo tweaking & fair challenges):**
  - **Re-spin Slot (`↻`) — Wheel-Animated Replacement:**
    - Clicking `↻` on any loadout slot (or quick Re-spin on `RevealBanner`) enters a `replaceTarget` spin state in `spinStore.svelte.ts`: switches to that slot's category tab, computes the eligible replacement pool (vacating the target slot and excluding the replaced item if ≥ 1 alternative exists), scrolls smoothly to the wheel on narrow mobile screens if out of view, displays a `"Re-spinning: <Item Name>"` status pill, animates the main `SpinWheel` using the active speed (`Normal` or `Fast Spin`) and sound, and swaps the landed item directly into that exact slot when the wheel stops.
    - **Equipment slot Re-spin scope *(Author's call)*:** When clicking `↻` on an Equipment slot attached to Hero X while Equipment relevance is ON, the replacement pool scopes strictly to **Hero X's** other eligible (unpicked) equipment for a clean in-place swap. When Equipment relevance is OFF, scopes to all unlocked TH equipment not yet picked.
  - **Hero Remove (`×`) & Hero Re-spin (`↻`) Cascade Rules:**
    - **Remove Hero (`×`):** Automatically removes all **unlocked** Equipment attached to that Hero. Any **locked (`🔒`)** Equipment on that Hero is detached into the *Unpaired Equipment* holding row instead of being deleted. Any attached **Pet** is moved to the *Unpaired Pets* holding row (since Pets are not hero-exclusive).
    - **Re-spin Hero (`↻`):** Removes the old Hero's **unlocked** Equipment (detaching any **locked** Equipment to Unpaired), **keeps the attached Pet** on that Hero slot so the newly spun Hero inherits it, and spins the Hero wheel excluding the replaced Hero (and excluding any freshly detached locked equipment of the replaced Hero from triggering a 0-hero relevance trap).
  - **Lock Slot (`🔒`):** Locked slots survive `"Clear Unlocked"` actions (and locked Equipment survives Hero removal/re-spin by moving to Unpaired) so friends can lock core picks and re-roll the rest.
  - **Remove (`×`):** Removes a single item cleanly (following Hero cascade rules above when removing a Hero).
- **Clan Challenge Sharing:**
  - **Copy Teks (`Copy Loadout`):** Copies a neatly formatted WhatsApp/Discord-friendly text block (including TH level, Heroes with their Equipment & Pets, Troops, Super Troops, Spells, Siege).
  - **Export Kartu PNG (`Download Card`):** Renders a clean, high-contrast Clash-styled **Loadout Summary Card** to PNG via `html-to-image` so players can drop it straight into clan chat or Discord.
- **Persistence:**
  - Auto-saves selected TH, filter toggles, speed/sound settings, and current loadout to `localStorage` so refreshing the browser never loses progress.

---

## 6. Architecture & Code Structure

```text
src/
├── data/                    # Pure TS typed Clash of Clans TH1–TH19 data
│   ├── types.ts             # Strict interfaces (HeroId, TroopRole, Item types, THConfig)
│   ├── townHalls.ts         # TH1–TH19 unlock rules, hero slot caps, pet slot caps
│   ├── troops.ts            # Elixir & Dark Elixir troops + multi-role tags + movement
│   ├── superTroops.ts       # Super troops + multi-role tags + movement
│   ├── spells.ts            # Elixir & Dark spells
│   ├── siegeMachines.ts     # Siege machines
│   ├── heroes.ts            # All 6 heroes (incl. Minion Prince & Dragon Duke)
│   ├── equipment.ts         # All Common/Epic equipment linked via heroId
│   ├── pets.ts              # All 12 pets (incl. Sneezy & Greedy Raven)
│   └── index.ts             # Aggregated catalog + integrity helper
├── engine/                  # Pure TypeScript business logic (100% framework-agnostic, Vitest tested)
│   ├── poolFilter.ts        # Computes eligible wheel items (TH + roles OR/AND + movement + relevance + limits)
│   ├── loadoutRules.ts      # Slot limits, Hero↔Equip↔Pet pairing, TH downgrade pruning, lock/re-spin logic
│   ├── wheelMath.ts         # Slice geometry, fair random pick, exact pointer-to-slice landing angle math
│   └── exportFormatter.ts   # WhatsApp/Discord text formatter
├── stores/
│   └── spinStore.svelte.ts  # Svelte 5 rune store ($state / $derived) + localStorage persistence
├── utils/
│   ├── audio.ts             # Web Audio API tick & reveal synthesizer
│   └── exportImage.ts       # html-to-image PNG card generator
├── components/
│   ├── SpinWheel.svelte     # SVG wheel + pointer + SPIN button + rAF animation loop
│   ├── SettingsPanel.svelte # TH dropdown, 7 category tabs, speed/sound/anti-dup/limits toggles
│   ├── FilterPanel.svelte   # Dynamic contextual filters (Troop roles OR/AND + movement; Hero↔Equip relevance)
│   ├── LoadoutPanel.svelte  # Structured Heroes(Equip+Pet) + Troops/Spells/Siege summary + Re-spin/Lock/Remove
│   ├── ExportCard.svelte    # Clean card template for PNG download
│   ├── UnitIcon.svelte      # Local asset renderer with deterministic Clash-styled SVG badge fallback
│   └── RevealBanner.svelte  # Compact post-spin feedback + quick re-spin/undo
├── App.svelte
└── main.ts

scripts/
└── fetch-coc-assets.mjs     # Dev script to download official CoC Wiki portraits into public/assets/coc/

public/assets/coc/           # Local bundled unit icons (troops/, super-troops/, spells/, siege/, heroes/, equipment/, pets/)
```

### Verification & Automated Testing Strategy
- **Data Integrity Tests (Vitest):** Assert every Equipment `heroId` references a valid Hero, every item has valid `unlockTh` (`1..19`), every Troop/Super Troop has ≥ 1 valid role tag, and no duplicate IDs exist.
- **Engine Unit Tests (Vitest):**
  - Troop role filtering: all-OFF returns full TH pool, `OR` union (`Main` + `Support`), `AND` intersection (`Tank` + `Main`), movement filter (`Ground`/`Air`), empty-pool detection.
  - Bidirectional Hero ↔ Equipment relevance: Hero-first auto-ON, Equipment-first auto-ON, seamless `Hero #1 → Equipment → Hero #2` flow (Hero relevance only restricts when unpaired equipment exists), per-direction manual overrides, 2-equipment-per-hero cap excluding full heroes, Hero Remove/Re-spin cascade (unlocked equip deleted, locked equip detached, Pet preserved), and Equipment slot Re-spin per-hero scoping.
  - TH slot limits: TH1–TH19 hero caps (0 up to max 4 active even with 6 heroes unlocked), Pet caps (0 before TH14, max 4 at TH14+), Super Troop max 2, Siege max 1 (with CC Donation TH10+ toggle vs Workshop TH12+), TH downgrade pruning.
  - Wheel angle math: every random slice index lands accurately inside its slice under the 3 o'clock pointer regardless of slice count (`1` slice edge case up to `35+` slices).

---

## 7. What's Left to the Builder

The builder has freedom over:
- Exact visual theme tokens (dark obsidian/slate surface colors, metallic gold/purple Clash-inspired accents, typography pairing, spacing, responsive breakpoints).
- Exact SVG wheel geometry details (font-size scaling for 1 slice vs 35+ slices, slice alternating tints, pointer animation bounce).
- Exact Web Audio API oscillator waveforms/frequencies for the tick & reveal sounds.
- Exact implementation of `scripts/fetch-coc-assets.mjs` (using MediaWiki API on `clashofclans.fandom.com` with polite rate limiting and PNG/WebP caching, plus clean fallback SVG generation for any missing portraits).
- Exact layout details of the exported PNG Loadout Card (`ExportCard.svelte`).
