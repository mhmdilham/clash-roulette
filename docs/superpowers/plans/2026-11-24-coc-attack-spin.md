# Clash of Clans Attack Spin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a client-side Clash of Clans Attack Spin web app covering TH1–TH19 data (7 categories including Dragon Duke, Greedy Raven, Heroic Spell, Ruin Witch, Meteor Golem) with multi-tag Troop role filtering, bidirectional Hero ↔ Equipment relevance, TH-accurate Hero/Pet/Equipment/Super/Siege limits, wheel-animated per-slot re-spin, and WhatsApp/Discord text & PNG loadout sharing.

**Architecture:** Pure TypeScript data modules (`src/data/`) and pure framework-agnostic engine modules (`src/engine/`) hold all Clash of Clans catalogs, pool-filtering rules, Hero↔Equipment↔Pet pairing, TH downgrade pruning, and SVG wheel geometry math, fully unit-tested with Vitest. A Svelte 5 rune store (`src/stores/spinStore.svelte.ts`) binds the engine to focused Svelte 5 UI components (`src/components/`) styled with Tailwind CSS v4, with local bundled CoC icons (`public/assets/coc/`) and deterministic SVG badge fallbacks.

**Tech Stack:** Vite, Svelte 5 (`$state`, `$derived`, `$effect`), TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), Vitest, `svelte-check`, `lucide-svelte`, `html-to-image`, Web Audio API.

**Spec:** `docs/superpowers/specs/2026-11-24-coc-attack-spin-design.md`

## Global Constraints

- 100% client-side static web app deployable on Vercel, Netlify, Cloudflare Pages, or GitHub Pages with zero backend runtime.
- Node v24.x / npm 11.x environment (`Vite` + `Svelte 5` + `TypeScript` + `Tailwind CSS v4`).
- UI chrome labels and feedback copy in **Bahasa Indonesia**; official Clash of Clans unit names, categories, and role tags in **English** (`Main`, `Support`, `Tank`, `Damage Dealer`, `Funnel`, `Clean-up`, `Ground`, `Air`).
- 7 core categories only in v1 (`troops`, `superTroops`, `siegeMachines`, `spells`, `heroes`, `equipment`, `pets`); TH19 Squads excluded.
- CoC unit portraits loaded from local `public/assets/coc/` (no runtime hotlinking to external sites) with automatic deterministic SVG badge fallback on missing/failed images.
- Zero dead-end empty wheels: every empty pool displays a clear Indonesian explanation and 1-click recovery action.
- Controls (`TH`, category tabs, filters, reset, slot re-spin) lock while `isSpinning === true`.

## Review Focus

1. **1-slice wheel & 0°/360° wraparound angle precision:** When TH1 (`Barbarian` only) or strict filters yield 1 eligible item, SVG arc rendering must draw a full circle instead of a degenerate 0-length arc, and pointer-to-slice math must map every landing angle (including wraparound across 360°) to the exact winning index. *(Pinned in Task 5 & Task 8)*
2. **Hero → Equipment → Hero loop & Hero Re-spin with Locked Equipment:** Spinning Hero #1 → 2 Equipment → returning to Heroes must NOT restrict/empty the Hero wheel; and re-spinning a Hero who owns a Locked (`🔒`) Equipment must detach the locked equipment without letting it trap the Hero re-spin wheel to 0 candidates. *(Pinned in Task 3 & Task 4)*
3. **Mid-session TH downgrade with locked items & slot caps:** Lowering TH (e.g. TH19 → TH12) must prune newly-locked items (even if locked), enforce the lower TH's Hero/Pet slot caps, never leave orphaned equipment attached to a removed Hero, and return the removed names for toast notification. *(Pinned in Task 4)*
4. **Corrupted or stale `localStorage` payload on boot:** Malformed JSON, wrong schema version, or references to unknown item IDs must gracefully sanitize/reset to defaults without crashing app startup. *(Pinned in Task 6)*
5. **Rapid clicks during active spin & missing icons during PNG export:** Re-triggering spin or mutating filters/loadout while `isSpinning === true` must be ignored; missing local `.png` icons must fall back cleanly to inline SVG badges in both `SpinWheel` and `ExportCard` PNG export without canvas errors. *(Pinned in Task 6, Task 7 & Task 9)*

---

## File Structure Overview

- `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/app.css`, `src/main.ts` — Vite + Svelte 5 + Tailwind v4 + Vitest setup.
- `src/data/types.ts`, `src/data/townHalls.ts`, `src/data/heroes.ts`, `src/data/equipment.ts`, `src/data/pets.ts`, `src/data/troops.ts`, `src/data/superTroops.ts`, `src/data/spells.ts`, `src/data/siegeMachines.ts`, `src/data/index.ts` — Complete TH1–TH19 typed catalog and lookup helpers.
- `src/engine/poolFilter.ts` — Eligible wheel pool computation (TH, roles OR/AND, movement, bidirectional Hero↔Equipment relevance, realistic limits, replacement scoping).
- `src/engine/loadoutRules.ts` — Pure loadout state transitions (insert, Hero↔Equipment↔Pet pairing, Hero remove/re-spin cascades, lock, clear, TH downgrade pruning).
- `src/engine/wheelMath.ts` — Fair random pick, landing rotation math, pointer angle inversion, SVG slice path builder (including 1-slice circle).
- `src/engine/exportFormatter.ts` — WhatsApp/Discord formatted text generator.
- `src/utils/audio.ts` — Web Audio API tick & reveal synthesizer.
- `src/utils/exportImage.ts` — `html-to-image` PNG export wrapper.
- `src/stores/spinStore.svelte.ts` — Svelte 5 rune store + versioned `localStorage` persistence.
- `scripts/fetch-coc-assets.mjs` — Dev script to fetch official CoC Wiki portraits into `public/assets/coc/`.
- `src/components/UnitIcon.svelte`, `SpinWheel.svelte`, `SettingsPanel.svelte`, `FilterPanel.svelte`, `RevealBanner.svelte`, `LoadoutPanel.svelte`, `ExportCard.svelte`, `src/App.svelte` — Responsive UI components.

---

### Task 1: Project Scaffolding, Core Types & Town Hall Config

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `svelte.config.js`, `index.html`, `.gitignore`
- Create: `src/data/types.ts`
- Create: `src/data/townHalls.ts`
- Test: `tests/data/townHalls.test.ts`

**Interfaces:**
- Consumes: None (foundation task).
- Produces:
  - `CategoryId = 'troops' | 'superTroops' | 'siegeMachines' | 'spells' | 'heroes' | 'equipment' | 'pets'`
  - `HeroId = 'barbarian-king' | 'archer-queen' | 'minion-prince' | 'grand-warden' | 'royal-champion' | 'dragon-duke'`
  - `TroopRole = 'Main' | 'Support' | 'Tank' | 'Damage Dealer' | 'Funnel' | 'Clean-up'`
  - `MovementType = 'ground' | 'air'`
  - `ResourceType = 'elixir' | 'dark'`
  - `EquipmentRarity = 'common' | 'epic'`
  - `MatchMode = 'OR' | 'AND'`
  - `SpinItem` discriminated union across all 7 categories (`TroopItem | SuperTroopItem | SiegeMachineItem | SpellItem | HeroItem | EquipmentItem | PetItem`), each with `{ id, name, category, unlockTh, iconPath }`
  - `TownHallConfig`: `{ level: number; maxActiveHeroes: number; maxPets: number; maxSuperTroops: number; maxSiege: number; blacksmithUnlocked: boolean }`
  - `TOWN_HALLS: readonly TownHallConfig[]` and `getTownHallConfig(th: number): TownHallConfig`
  - `LoadoutState`, `HeroSlot`, `EquipmentEntry`, `PetEntry`, `ArmyEntry`, `FilterState`, `SlotTarget`, `ReplaceTarget`

- [ ] **Step 1: Initialize git repo and scaffold Vite + Svelte 5 + TypeScript + Tailwind v4 + Vitest**

Initialize git (`git init`), create `package.json` with scripts (`dev`, `build`, `preview`, `test`, `check`), install runtime deps (`lucide-svelte`, `html-to-image`) and dev deps (`svelte`, `@sveltejs/vite-plugin-svelte`, `vite`, `typescript`, `svelte-check`, `tailwindcss`, `@tailwindcss/vite`, `vitest`, `jsdom`), and create `vite.config.ts` (registering `svelte()` and `tailwindcss()` plus Vitest config), `svelte.config.js` (`vitePreprocess()`), `tsconfig.json` (strict mode), `.gitignore`, and minimal `index.html`.

- [ ] **Step 2: Write the failing test `tests/data/townHalls.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { TOWN_HALLS, getTownHallConfig } from '../../src/data/townHalls';

describe('townHalls config (TH1-TH19)', () => {
  it('defines contiguous TH1 through TH19', () => {
    expect(TOWN_HALLS).toHaveLength(19);
    expect(TOWN_HALLS.map((t) => t.level)).toEqual(Array.from({ length: 19 }, (_, i) => i + 1));
  });

  it('caps active heroes at max 4 and pets at 0 before TH14, 4 from TH14+', () => {
    expect(getTownHallConfig(1).maxActiveHeroes).toBe(0);
    expect(getTownHallConfig(13).maxActiveHeroes).toBe(4);
    expect(getTownHallConfig(19).maxActiveHeroes).toBe(4);
    expect(getTownHallConfig(13).maxPets).toBe(0);
    expect(getTownHallConfig(14).maxPets).toBe(4);
    expect(getTownHallConfig(19).maxPets).toBe(4);
  });

  it('enforces super troop cap 2 from TH11+ and siege cap 1 from TH10+', () => {
    expect(getTownHallConfig(10).maxSuperTroops).toBe(0);
    expect(getTownHallConfig(11).maxSuperTroops).toBe(2);
    expect(getTownHallConfig(9).maxSiege).toBe(0);
    expect(getTownHallConfig(10).maxSiege).toBe(1);
    expect(getTownHallConfig(19).maxSiege).toBe(1);
  });

  it('clamps out-of-range TH lookups safely', () => {
    expect(getTownHallConfig(0).level).toBe(1);
    expect(getTownHallConfig(99).level).toBe(19);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/data/townHalls.test.ts`  
Expected: FAIL with module not found for `src/data/townHalls`.

- [ ] **Step 4: Implement `src/data/types.ts` and `src/data/townHalls.ts`**

- In `src/data/types.ts`: define all exported types listed in **Interfaces** above. Verify exact Hero Hall unlock TH thresholds against the Clash of Clans Wiki (e.g., confirm whether Barbarian King unlocks at TH7 or TH4 via Hero Hall Lv1, Archer Queen TH8, Minion Prince TH9, Grand Warden TH11, Royal Champion TH13, Dragon Duke TH15) and document the verified Hero Hall mapping in `townHalls.ts` so `maxActiveHeroes` equals `min(4, count of heroes unlocked at TH)`.
- In `src/data/townHalls.ts`: export `TOWN_HALLS` (TH1..TH19) and `getTownHallConfig(th: number): TownHallConfig` (clamped `1..19`).

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/data/townHalls.test.ts`  
Expected: PASS (4/4 tests).

- [ ] **Step 6: Commit**

```bash
git add .gitignore package.json package-lock.json vite.config.ts svelte.config.js tsconfig.json index.html src/data/types.ts src/data/townHalls.ts tests/data/townHalls.test.ts
git commit -m "chore: scaffold Svelte 5 Vite Tailwind v4 project with CoC core types and TH1-TH19 config"
```

---

### Task 2: Complete TH1–TH19 Clash of Clans Dataset & Integrity Tests

**Files:**
- Create: `src/data/heroes.ts`
- Create: `src/data/equipment.ts`
- Create: `src/data/pets.ts`
- Create: `src/data/troops.ts`
- Create: `src/data/superTroops.ts`
- Create: `src/data/spells.ts`
- Create: `src/data/siegeMachines.ts`
- Create: `src/data/index.ts`
- Test: `tests/data/catalog.test.ts`

**Interfaces:**
- Consumes: All types and `getTownHallConfig` from `src/data/types.ts` and `src/data/townHalls.ts`.
- Produces:
  - `HEROES: readonly HeroItem[]` (6 heroes)
  - `EQUIPMENT: readonly EquipmentItem[]` (all Common + Epic equipment for all 6 heroes)
  - `PETS: readonly PetItem[]` (all 12 pets)
  - `TROOPS: readonly TroopItem[]` (all Elixir + Dark Elixir Home Village troops through TH19)
  - `SUPER_TROOPS: readonly SuperTroopItem[]` (all 17+ Super Troops through TH19)
  - `SPELLS: readonly SpellItem[]` (all Elixir + Dark Spells through TH19)
  - `SIEGE_MACHINES: readonly SiegeMachineItem[]` (all 8+ Siege Machines with official Workshop `unlockTh` 12–16)
  - `ALL_ITEMS: readonly SpinItem[]`
  - `CATEGORIES: readonly { id: CategoryId; label: string }[]`
  - `getItemsByCategory(category: CategoryId): readonly SpinItem[]`
  - `getItemById(id: string): SpinItem | undefined`
  - `getAvailableCategories(th: number, includeCcSiege: boolean): CategoryId[]`

- [ ] **Step 1: Verify complete late-2026 TH19 roster against Clash of Clans Wiki**

Cross-check every category's complete item list and `unlockTh` (Elixir & Dark Troops including `Meteor Golem`, `Thrower`, `Furnace`, `Druid`, `Root Rider`, `Ruin Witch`; Super Troops including `Super Yeti`; Spells including `Heroic Spell`, `Totem Spell`, `Ice Block Spell`, `Revive Spell`, `Overgrowth Spell`; Siege Machines including `Troop Launcher`; all 6 Heroes; all Common & Epic Hero Equipment including Dragon Duke's `Fire Heart`, `Flame Blower`, `Stun Blaster`, `Rocket Backpack`, `Electro Fangs`, BK's `Stick Horse`, AQ's `Monolith Arrow`, MP's `Portal Pendant`, etc.; all 12 Pets including `Sneezy` and `Greedy Raven`).

- [ ] **Step 2: Write the failing test `tests/data/catalog.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import {
  ALL_ITEMS,
  HEROES,
  EQUIPMENT,
  PETS,
  TROOPS,
  SUPER_TROOPS,
  SPELLS,
  SIEGE_MACHINES,
  getAvailableCategories,
  getItemById,
} from '../../src/data';

const VALID_ROLES = new Set(['Main', 'Support', 'Tank', 'Damage Dealer', 'Funnel', 'Clean-up']);

describe('CoC TH1-TH19 catalog integrity', () => {
  it('has globally unique item IDs and valid TH1-19 unlock levels', () => {
    const ids = ALL_ITEMS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of ALL_ITEMS) {
      expect(item.unlockTh).toBeGreaterThanOrEqual(1);
      expect(item.unlockTh).toBeLessThanOrEqual(19);
      expect(item.iconPath).toMatch(/^\/assets\/coc\//);
    }
  });

  it('includes latest 2026 TH18-TH19 content', () => {
    expect(HEROES).toHaveLength(6);
    expect(getItemById('dragon-duke')?.category).toBe('heroes');
    expect(getItemById('fire-heart')?.category).toBe('equipment');
    expect(getItemById('greedy-raven')?.category).toBe('pets');
    expect(getItemById('heroic-spell')?.category).toBe('spells');
    expect(getItemById('meteor-golem')?.category).toBe('troops');
    expect(getItemById('ruin-witch')?.category).toBe('troops');
    expect(getItemById('super-yeti')?.category).toBe('superTroops');
    expect(getItemById('troop-launcher')?.category).toBe('siegeMachines');
    expect(PETS.length).toBeGreaterThanOrEqual(12);
    expect(SIEGE_MACHINES.length).toBeGreaterThanOrEqual(8);
  });

  it('links every equipment to a valid heroId and gives every hero >= 2 equipment', () => {
    const heroIds = new Set(HEROES.map((h) => h.id));
    for (const eq of EQUIPMENT) {
      expect(heroIds.has(eq.heroId)).toBe(true);
    }
    for (const hero of HEROES) {
      const count = EQUIPMENT.filter((e) => e.heroId === hero.id).length;
      expect(count).toBeGreaterThanOrEqual(2);
    }
  });

  it('assigns >= 1 valid role and movement type to every Troop and Super Troop', () => {
    for (const unit of [...TROOPS, ...SUPER_TROOPS]) {
      expect(unit.roles.length).toBeGreaterThanOrEqual(1);
      for (const role of unit.roles) {
        expect(VALID_ROLES.has(role)).toBe(true);
      }
      expect(['ground', 'air']).toContain(unit.movement);
    }
  });

  it('exposes categories accurately by TH including CC Siege toggle', () => {
    expect(getAvailableCategories(1, true)).toEqual(['troops']);
    expect(getAvailableCategories(10, true)).toContain('siegeMachines');
    expect(getAvailableCategories(10, false)).not.toContain('siegeMachines');
    expect(getAvailableCategories(12, false)).toContain('siegeMachines');
    expect(getAvailableCategories(13, true)).not.toContain('pets');
    expect(getAvailableCategories(14, true)).toContain('pets');
    expect(getAvailableCategories(19, true)).toHaveLength(7);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/data/catalog.test.ts`  
Expected: FAIL with module not found for `src/data`.

- [ ] **Step 4: Implement all 7 data modules and `src/data/index.ts`**

Create `heroes.ts`, `equipment.ts`, `pets.ts`, `troops.ts`, `superTroops.ts`, `spells.ts`, `siegeMachines.ts`, and `index.ts`. Ensure multi-role tags on every Troop & Super Troop reflect real CoC attack roles (e.g., `Root Rider`: `['Main', 'Tank']`; `Baby Dragon`: `['Funnel', 'Clean-up']`; `Healer`: `['Support']`; `Meteor Golem`: `['Main', 'Tank']`; `Wizard`: `['Damage Dealer', 'Funnel', 'Clean-up']`; `Super Wall Breaker`: `['Support']`). Set every item's `iconPath` to `/assets/coc/${category}/${id}.png`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/data/catalog.test.ts`  
Expected: PASS (5/5 tests).

- [ ] **Step 6: Commit**

```bash
git add src/data/ tests/data/catalog.test.ts
git commit -m "feat: add verified TH1-TH19 Clash of Clans dataset across all 7 categories"
```

---

### Task 3: Pure Filtering & Bidirectional Relevance Engine (`src/engine/poolFilter.ts`)

**Files:**
- Create: `src/engine/poolFilter.ts`
- Test: `tests/engine/poolFilter.test.ts`

**Interfaces:**
- Consumes: `src/data/index.ts`, `src/data/townHalls.ts`, `src/data/types.ts`
- Produces:
  - `EmptyPoolReason = 'slot-full' | 'no-role-match' | 'all-heroes-equipped' | 'no-relevant-heroes' | 'all-picked' | 'category-locked'`
  - `PoolFilterInput`: `{ townHall: number; category: CategoryId; loadout: LoadoutState; filters: FilterState; replaceTarget?: ReplaceTarget | null }`
  - `PoolFilterResult`: `{ items: SpinItem[]; totalAtTh: number; emptyReason: EmptyPoolReason | null; relevanceAutoActive: boolean; relevanceEffective: boolean; slotUsage: { used: number; max: number | null } }`
  - `computeEligiblePool(input: PoolFilterInput): PoolFilterResult`
  - `getEffectiveRelevance(category: 'heroes' | 'equipment', loadout: LoadoutState, filters: FilterState, ignoreUnpairedHeroId?: HeroId): { autoActive: boolean; effective: boolean }`

- [ ] **Step 1: Write the failing test `tests/engine/poolFilter.test.ts`**

Cover all spec rules + Review Focus #2:
- Troop role filter:
  - All role chips OFF → returns full unlocked TH troop pool (pure random).
  - `Main` + `Support` with `OR` → returns union of troops tagged `Main` OR `Support`.
  - `Tank` + `Main` with `AND` → returns intersection only (e.g. `Root Rider`, `Meteor Golem`, excludes `Healer` and `Golem` if not `Main`).
  - `movement: 'air'` combines with role chips; impossible filter combination sets `emptyReason: 'no-role-match'`.
  - Applies identically to `superTroops`.
- Siege `includeCcSiege`:
  - At TH10 with `includeCcSiege: true` → all Siege Machines available.
  - At TH10 with `includeCcSiege: false` → `items: []`, `emptyReason: 'category-locked'`.
  - At TH12 with `includeCcSiege: false` → only `unlockTh <= 12` Siege Machines (`Wall Wrecker`, `Battle Blimp`, `Stone Slammer`).
- Bidirectional Hero ↔ Equipment relevance:
  - Hero-first (`Barbarian King` chosen) → on `equipment` tab, `relevanceAutoActive: true`, `relevanceEffective: true`, pool contains ONLY BK equipment.
  - When BK already has 2/2 equipment and realistic limits ON → BK's remaining equipment excluded, `emptyReason: 'all-heroes-equipped'`.
  - **Review Focus #2 (Hero → Equip → Hero seamless loop):** With BK chosen AND 2 BK equipment paired to BK (zero unpaired equipment), switching to `heroes` tab has `relevanceAutoActive: false`, `relevanceEffective: false`, and shows all 5 remaining Heroes!
  - Equipment-first (`Fire Heart` in `unpairedEquipment`, zero Heroes chosen) → on `heroes` tab, `relevanceAutoActive: true`, `relevanceEffective: true`, pool contains ONLY `Dragon Duke`.
  - Per-direction override: setting `heroRelevanceOverride: false` unlocks all Heroes while keeping `equipment` tab relevance ON (`equipRelevanceOverride: null`).
- Realistic TH limits:
  - Heroes capped at `maxActiveHeroes` (4 at TH19) → 4 heroes picked yields `emptyReason: 'slot-full'`; with `realisticLimits: false` remaining heroes remain spinnable.
  - Pets capped at `maxPets` (4 at TH14+); Super Troops capped at 2; Siege capped at 1.
- Replacement scoping (`replaceTarget`):
  - Re-spinning a paired Equipment slot on BK (with Equipment relevance ON, even when AQ is also chosen) restricts pool strictly to BK's other unpicked equipment and excludes the replaced item.
  - Re-spinning a Hero slot when the replaced Hero had a Locked equipment detached (`ignoreUnpairedHeroId`) does NOT trap the Hero wheel to 0 heroes — returns all other unchosen heroes.
  - Re-spinning a full category (e.g. Siege `1/1` or Heroes `4/4`) vacates the target slot so it does NOT report `slot-full`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/engine/poolFilter.test.ts`  
Expected: FAIL with module not found for `src/engine/poolFilter`.

- [ ] **Step 3: Implement `src/engine/poolFilter.ts`**

Implement `getEffectiveRelevance` and `computeEligiblePool` cleanly:
1. Base pool from `getItemsByCategory(category)` filtered by `item.unlockTh <= townHall` (except `siegeMachines` when `filters.includeCcSiege && townHall >= 10` returns all siege machines).
2. Check slot caps when `filters.realisticLimits && !replaceTarget` (Heroes, Pets, Super Troops, Siege; Equipment checks whether any hero can accept equipment or overall cap).
3. Apply `troops` / `superTroops` movement + multi-role (`OR` / `AND`) filter.
4. Apply bidirectional Hero ↔ Equipment relevance + `replaceTarget` scoping (paired equipment re-spin scopes to `replaceTarget.heroId` when Equipment relevance is effective; Hero re-spin ignores `replaceTarget.ignoreUnpairedHeroId` when checking unpaired equipment).
5. Apply `antiDuplicate` exclusion (and always exclude duplicates for Heroes, Equipment, Pets, Super Troops, Siege; exclude `replaceTarget.currentItemId` if ≥ 1 other candidate exists).
6. Return exact `EmptyPoolReason` priority when `items.length === 0`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/engine/poolFilter.test.ts`  
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/engine/poolFilter.ts tests/engine/poolFilter.test.ts
git commit -m "feat: add pool filtering and bidirectional Hero-Equipment relevance engine"
```

---

### Task 4: Loadout State Transitions, Cascades, TH Pruning & Text Exporter

**Files:**
- Create: `src/engine/loadoutRules.ts`
- Create: `src/engine/exportFormatter.ts`
- Test: `tests/engine/loadoutRules.test.ts`
- Test: `tests/engine/exportFormatter.test.ts`

**Interfaces:**
- Consumes: `src/data/index.ts`, `src/data/townHalls.ts`, `src/data/types.ts`
- Produces (`src/engine/loadoutRules.ts`):
  - `createEmptyLoadout(): LoadoutState`
  - `applySpinResult(loadout: LoadoutState, item: SpinItem, options: { realisticLimits: boolean; replaceTarget?: ReplaceTarget | null }): LoadoutState`
  - `removeLoadoutItem(loadout: LoadoutState, target: SlotTarget): LoadoutState`
  - `toggleSlotLock(loadout: LoadoutState, target: SlotTarget): LoadoutState`
  - `clearUnlockedLoadout(loadout: LoadoutState): LoadoutState`
  - `pruneLoadoutForTownHall(loadout: LoadoutState, newTh: number, includeCcSiege: boolean): { loadout: LoadoutState; removedNames: string[] }`
- Produces (`src/engine/exportFormatter.ts`):
  - `formatLoadoutText(loadout: LoadoutState, townHall: number): string`

- [ ] **Step 1: Write the failing tests `tests/engine/loadoutRules.test.ts` and `tests/engine/exportFormatter.test.ts`**

Test assertions in `loadoutRules.test.ts`:
- Adding Equipment when owning Hero is in loadout attaches it to that Hero's `equipment` array (up to 2 when `realisticLimits: true`, overflow goes to `unpairedEquipment`).
- Adding Equipment BEFORE owning Hero places it in `unpairedEquipment`; subsequently adding that Hero automatically pulls up to 2 matching equipment from `unpairedEquipment` onto the Hero slot!
- Adding a Pet automatically pairs to the first Hero slot with `pet === null`; if no open Hero slot exists, stores in `unpairedPets`; adding a Hero later auto-pairs the first `unpairedPets` entry.
- **Decision 2A — Remove Hero (`×`) cascade:** Removing BK (who has 1 unlocked equipment, 1 locked equipment, and 1 attached Pet) deletes the unlocked equipment, moves the locked equipment to `unpairedEquipment`, and moves the Pet to `unpairedPets`.
- **Decision 2A — Re-spin Hero (`↻`) cascade:** Replacing BK slot with `Dragon Duke` deletes BK's unlocked equipment, moves BK's locked equipment to `unpairedEquipment`, **keeps BK's Pet on the slot (now paired with Dragon Duke)**, and auto-attaches any unpaired Dragon Duke equipment!
- **Decision 1A — Re-spin Paired Equipment / Troop / Spell / Pet / Siege:** Replaces exact entry in-place while preserving slot order and lock flag reset to `false`.
- `clearUnlockedLoadout`: keeps locked Heroes (and their locked equipment/pet), locked Troops/Super/Spells/Siege, and drops all unlocked items.
- **Review Focus #3 — TH downgrade pruning:** Lowering TH19 → TH12 prunes `Dragon Duke`, all Pets (`Greedy Raven`, `Unicorn`), TH13+ spells (`Heroic Spell`, `Recall Spell`), TH13+ troops (`Meteor Golem`, `Root Rider`), and removes any equipment belonging to pruned Heroes (even if locked!), returning `removedNames` listing every removed item name. Lowering TH12 → TH8 caps Heroes to TH8's `maxActiveHeroes`.

Test assertions in `exportFormatter.test.ts`:
- Formats a complete TH19 loadout into clean WhatsApp/Discord markdown/text with header `⚔️ CoC Attack Spin (TH19)`, Heroes with `[Equip 1, Equip 2] + Pet`, Troops, Super Troops, Spells, Siege, and omits empty sections cleanly.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/engine/loadoutRules.test.ts tests/engine/exportFormatter.test.ts`  
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `src/engine/loadoutRules.ts` and `src/engine/exportFormatter.ts`**

Write pure, immutable transformations (never mutating input objects) implementing all pairing, cascade, lock, clear, and TH-pruning invariants.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/engine/loadoutRules.test.ts tests/engine/exportFormatter.test.ts`  
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/engine/loadoutRules.ts src/engine/exportFormatter.ts tests/engine/loadoutRules.test.ts tests/engine/exportFormatter.test.ts
git commit -m "feat: add loadout rules, Hero cascade pairing, TH pruning, and text formatter"
```

---

### Task 5: Wheel Geometry Math & Web Audio Synthesizer

**Files:**
- Create: `src/engine/wheelMath.ts`
- Create: `src/utils/audio.ts`
- Test: `tests/engine/wheelMath.test.ts`

**Interfaces:**
- Consumes: None.
- Produces (`src/engine/wheelMath.ts`):
  - `pickRandomIndex(length: number, rng?: () => number): number` (uses `crypto.getRandomValues` fallback to `Math.random` when `rng` omitted)
  - `computeTargetRotation(currentDeg: number, targetIndex: number, sliceCount: number, options?: { minSpins?: number; jitterRatio?: number; rng?: () => number }): number`
  - `getSliceIndexAtPointer(rotationDeg: number, sliceCount: number): number` (pointer fixed at 3 o'clock = `0°`; slice `i` spans `[i * step, (i + 1) * step)` in local wheel coordinates where `0°` is 3 o'clock clockwise)
  - `describeSlicePath(cx: number, cy: number, radius: number, startDeg: number, endDeg: number): string` (handles `endDeg - startDeg >= 360` with two 180° arcs so 1-slice wheel draws a true circle!)
  - `getSliceMidAngle(index: number, sliceCount: number): number`
- Produces (`src/utils/audio.ts`):
  - `class SpinAudio`: `setEnabled(enabled: boolean)`, `setVolume(volume: number)`, `playTick()`, `playReveal()`

- [ ] **Step 1: Write the failing test `tests/engine/wheelMath.test.ts`**

Cover **Review Focus #1** thoroughly:
```ts
import { describe, it, expect } from 'vitest';
import {
  computeTargetRotation,
  getSliceIndexAtPointer,
  describeSlicePath,
  pickRandomIndex,
} from '../../src/engine/wheelMath';

describe('wheelMath', () => {
  it('maps target rotation back to exact winning slice for slice counts 1, 2, 3, 6, 12, 35', () => {
    for (const count of [1, 2, 3, 6, 12, 35]) {
      for (const startDeg of [0, 37, 359.9, 1420.5]) {
        for (let target = 0; target < count; target++) {
          const endDeg = computeTargetRotation(startDeg, target, count, {
            minSpins: 4,
            rng: () => 0.5,
          });
          expect(endDeg).toBeGreaterThan(startDeg + 360 * 3);
          expect(getSliceIndexAtPointer(endDeg, count)).toBe(target);
        }
      }
    }
  });

  it('handles 0/360 wraparound and negative angles in getSliceIndexAtPointer', () => {
    expect(getSliceIndexAtPointer(0, 4)).toBe(0);
    expect(getSliceIndexAtPointer(360, 4)).toBe(0);
    expect(getSliceIndexAtPointer(359.99, 4)).toBe(0);
    expect(getSliceIndexAtPointer(-10, 4)).toBe(0);
  });

  it('produces a non-degenerate full-circle SVG path for 1-slice wheels', () => {
    const path = describeSlicePath(200, 200, 180, 0, 360);
    expect(path).toContain('A 180 180');
    expect(path.match(/A 180 180/g)?.length).toBe(2);
  });

  it('picks valid indices in [0, length - 1]', () => {
    expect(pickRandomIndex(1)).toBe(0);
    expect(pickRandomIndex(10, () => 0.9999)).toBe(9);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/engine/wheelMath.test.ts`  
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `src/engine/wheelMath.ts` and `src/utils/audio.ts`**

- In `wheelMath.ts`: Remember that rotating the wheel clockwise by `R` degrees moves local wheel angle `(360 - (R % 360)) % 360` under the fixed 3 o'clock (`0°`) pointer! Compute `targetRotation` strictly increasing from `currentDeg` with `minSpins` full turns plus safe interior jitter (`±0.35 * sliceAngle`) so landing never sits ambiguously on a border line.
- In `audio.ts`: Synthesize a crisp short percussive click (triangle/sine burst ~800Hz→220Hz, 28ms) for `playTick()` and a pleasant 2-note major-fifth chime for `playReveal()`, safely guarded when `window.AudioContext` is absent.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/engine/wheelMath.test.ts`  
Expected: PASS (4/4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/wheelMath.ts src/utils/audio.ts tests/engine/wheelMath.test.ts
git commit -m "feat: add SVG wheel angle math and Web Audio tick/reveal synthesizer"
```

---

### Task 6: Svelte 5 Reactive Store & Resilient `localStorage` Persistence

**Files:**
- Create: `src/stores/persistence.ts`
- Create: `src/stores/spinStore.svelte.ts`
- Test: `tests/stores/persistence.test.ts`

**Interfaces:**
- Consumes: `src/data/index.ts`, `src/engine/poolFilter.ts`, `src/engine/loadoutRules.ts`, `src/utils/audio.ts`
- Produces (`src/stores/persistence.ts`):
  - `STORAGE_KEY = 'coc-attack-spin:v1'`
  - `PersistedState`: `{ version: 1; townHall: number; activeCategory: CategoryId; filters: FilterState; loadout: LoadoutState; fastSpin: boolean; soundEnabled: boolean; soundVolume: number }`
  - `loadPersistedState(storage?: Pick<Storage, 'getItem'>): PersistedState` (sanitizes/prunes unknown IDs, falls back cleanly on corrupt JSON)
  - `savePersistedState(state: PersistedState, storage?: Pick<Storage, 'setItem'>): void`
- Produces (`src/stores/spinStore.svelte.ts`):
  - `spinStore` singleton instance exposing reactive getters (`townHall`, `activeCategory`, `availableCategories`, `filters`, `loadout`, `poolResult`, `isSpinning`, `replaceTarget`, `lastReveal`, `toastMessage`, `fastSpin`, `soundEnabled`, `soundVolume`) and actions (`setTownHall`, `setCategory`, `toggleRole`, `setMatchMode`, `setMovement`, `resetTroopFilters`, `toggleIncludeCcSiege`, `toggleRealisticLimits`, `toggleAntiDuplicate`, `toggleRelevance`, `setFastSpin`, `setSoundEnabled`, `setSoundVolume`, `beginSpin`, `completeSpin`, `startSlotRespin`, `cancelReplaceTarget`, `removeSlot`, `toggleLock`, `clearUnlocked`, `clearAll`, `resetCategory`, `dismissToast`). Every mutating action is a no-op while `isSpinning === true` (except `completeSpin` and `dismissToast`).

- [ ] **Step 1: Write the failing test `tests/stores/persistence.test.ts`**

Cover **Review Focus #4 & #5**:
- Round-trips valid `PersistedState` cleanly through mock storage.
- Corrupted JSON (`"{not json"`), wrong version (`{ version: 999 }`), or missing fields returns clean TH19 defaults without throwing.
- Persisted loadout containing deleted/unknown item IDs (e.g. `'removed-troop-xyz'` or hero `'fake-hero'`) sanitizes them out while preserving valid items (`'dragon-duke'`, `'fire-heart'`).
- Invalid `activeCategory` for the saved TH (e.g. `'pets'` at TH10) falls back to `'troops'`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/stores/persistence.test.ts`  
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `src/stores/persistence.ts` and `src/stores/spinStore.svelte.ts`**

- In `persistence.ts`: pure validation/sanitization functions using `getItemById` and `getAvailableCategories`.
- In `spinStore.svelte.ts`: class using Svelte 5 `$state` fields and `$derived` getters (`availableCategories`, `poolResult`), persisting via `$effect` (or explicit save helper on every mutation so it works reliably both in browser and non-root contexts), guarding all mutating actions with `if (this.isSpinning) return;`.

- [ ] **Step 4: Run test & typecheck to verify they pass**

Run: `npx vitest run tests/stores/persistence.test.ts && npx svelte-check`  
Expected: PASS (0 errors).

- [ ] **Step 5: Commit**

```bash
git add src/stores/persistence.ts src/stores/spinStore.svelte.ts tests/stores/persistence.test.ts
git commit -m "feat: add Svelte 5 reactive spin store with resilient localStorage persistence"
```

---

### Task 7: Local CoC Asset Pipeline & `UnitIcon.svelte` Fallback Component

**Files:**
- Create: `scripts/fetch-coc-assets.mjs`
- Create: `src/components/UnitIcon.svelte`
- Create: `public/assets/coc/` (populated portraits via script)

**Interfaces:**
- Consumes: `src/data/` item IDs, names, categories, rarities, resources.
- Produces:
  - `npm run fetch-assets` script in `package.json` running `node scripts/fetch-coc-assets.mjs`.
  - `UnitIcon.svelte` props: `{ item: SpinItem; size?: number; class?: string }` — renders `/assets/coc/${item.category}/${item.id}.png`, automatically switching on error to a clean deterministic SVG emblem (category/resource/rarity gradient + crisp 2-letter monogram) so broken icons never render.

- [ ] **Step 1: Implement `scripts/fetch-coc-assets.mjs` and add `"fetch-assets"` to `package.json`**

Use Clash of Clans Wiki MediaWiki API (`https://clashofclans.fandom.com/api.php?action=query&titles=...&prop=pageimages&pithumbsize=160&format=json`) with polite concurrency (3–4 parallel requests), skipping files already on disk, saving PNG/WebP portraits to `public/assets/coc/<category>/<id>.png`, and printing a clear summary of fetched vs missing icons (never failing the build if a brand-new unit lacks a wiki thumbnail).

- [ ] **Step 2: Run asset fetcher to populate `public/assets/coc/`**

Run: `npm run fetch-assets`  
Expected: Script completes cleanly and saves local portrait icons under `public/assets/coc/` across all 7 categories (any missing newly-released unit is logged cleanly and covered by `UnitIcon.svelte` fallback).

- [ ] **Step 3: Implement `src/components/UnitIcon.svelte`**

Use Svelte 5 `$props()` and `$state(false)` (`imgFailed`), resetting `imgFailed = false` when `item.id` changes (`$effect`), rendering a styled SVG emblem fallback when `imgFailed` is true. Include `crossorigin="anonymous"`-free local relative URLs so `html-to-image` PNG export works cleanly with zero canvas tainting.

- [ ] **Step 4: Run `svelte-check` to verify component compiles cleanly**

Run: `npx svelte-check`  
Expected: PASS (0 errors).

- [ ] **Step 5: Commit**

```bash
git add package.json scripts/fetch-coc-assets.mjs src/components/UnitIcon.svelte public/assets/coc/
git commit -m "feat: add local CoC portrait asset pipeline and UnitIcon fallback component"
```

---

### Task 8: Spinning Wheel, Settings Panel, Contextual Filter Panel & Reveal Banner

**Files:**
- Create: `src/components/SpinWheel.svelte`
- Create: `src/components/SettingsPanel.svelte`
- Create: `src/components/FilterPanel.svelte`
- Create: `src/components/RevealBanner.svelte`

**Interfaces:**
- Consumes: `spinStore` from `src/stores/spinStore.svelte.ts`, `wheelMath.ts`, `SpinAudio`, `UnitIcon.svelte`.
- Produces:
  - `SpinWheel.svelte`: Interactive circular SVG wheel (dark obsidian/slate surface, metallic gold outer rim, purple/gold center `SPIN!` button, 3 o'clock pointer with subtle bounce on tick, unit icon + radial label per slice, handles 1–35+ slices cleanly, `requestAnimationFrame` cubic/quartic ease-out animation firing `audio.playTick()` per slice boundary crossing, `Normal` ~3.8s vs `Fast Spin` ~1.0s, subtle idle slow rotation respecting `prefers-reduced-motion`, `"Re-spinning: <Name>"` banner + cancel button when `replaceTarget` active, and inline SVG fallback for missing wheel icons).
  - `SettingsPanel.svelte`: TH1–TH19 selector, 7 category buttons with live slot count pills (`2/4`, `1/2`, `1/1`), `Normal / Fast Spin` toggle, `Anti-Duplikat` toggle, `Batas Realistis TH` toggle, sound mute + volume slider, `Reset` button.
  - `FilterPanel.svelte`: Contextual controls:
    - `troops` / `superTroops`: 6 role toggle chips (`Main`, `Support`, `Tank`, `Damage Dealer`, `Funnel`, `Clean-up`), `OR / AND` toggle, `Semua / Ground / Air` selector, live pool badge (`14 / 32 unit di roda`), `Reset Filter` button.
    - `heroes` / `equipment`: `Hanya Relevan` toggle with helper text explaining active Hero↔Equipment link + empty-pool recovery buttons (`[Lanjut Spin Hero]`, `[Matikan Filter Relevan]`).
    - `siegeMachines`: `Termasuk Donasi CC (TH10+)` toggle.
  - `RevealBanner.svelte`: Compact post-spin reveal card showing landed item portrait, name, role badges / owning Hero badge, and quick `Re-spin (↻)` button.

- [ ] **Step 1: Implement `src/components/SpinWheel.svelte`**

Wire `spinStore.poolResult.items`, `spinStore.isSpinning`, `spinStore.replaceTarget`, and `spinStore.fastSpin`.
- When `spinStore.replaceTarget` becomes active from `LoadoutPanel`, auto-trigger the wheel spin seamlessly (with optional smooth scroll into view on narrow viewports).
- Track image load failures in a reactive `Set<string>` inside `SpinWheel` so slices whose local `.png` is missing render a clean SVG circle+initials badge inside the `<svg>` (Review Focus #5).
- Verify 1-slice rendering uses `describeSlicePath` full circle and disables pointer ambiguity.

- [ ] **Step 2: Implement `src/components/SettingsPanel.svelte`, `FilterPanel.svelte`, and `RevealBanner.svelte`**

Ensure all controls disable gracefully while `spinStore.isSpinning === true`, all labels follow Bahasa Indonesia UI + English CoC terminology, and empty-pool states always show clear recovery actions.

- [ ] **Step 3: Run `svelte-check` and existing unit tests**

Run: `npx svelte-check && npx vitest run`  
Expected: PASS (0 type errors, all engine/data tests passing).

- [ ] **Step 4: Commit**

```bash
git add src/components/SpinWheel.svelte src/components/SettingsPanel.svelte src/components/FilterPanel.svelte src/components/RevealBanner.svelte
git commit -m "feat: add SVG SpinWheel, SettingsPanel, contextual FilterPanel, and RevealBanner"
```

---

### Task 9: Loadout Panel, PNG Export Card, App Shell & End-to-End Verification

**Files:**
- Create: `src/utils/exportImage.ts`
- Create: `src/components/ExportCard.svelte`
- Create: `src/components/LoadoutPanel.svelte`
- Create: `src/App.svelte`
- Create: `src/app.css`
- Create: `src/main.ts`

**Interfaces:**
- Consumes: `spinStore`, `formatLoadoutText`, `UnitIcon`, `SpinWheel`, `SettingsPanel`, `FilterPanel`, `RevealBanner`.
- Produces:
  - `exportElementToPng(el: HTMLElement, filename: string): Promise<void>` in `src/utils/exportImage.ts` (uses `html-to-image` `toPng` with `pixelRatio: 2`, dark background fill, triggering clean browser download).
  - Complete responsive `App.svelte` combining header, two-column desktop / stacked mobile wheel + settings/filter workspace, `RevealBanner`, `LoadoutPanel` (Heroes with 2 Equipment + 1 Pet sub-slots, Unpaired Equipment/Pets trays, Troops with role chips, Super Troops, Spells, Siege, per-slot `↻` / `🔒` / `×`, `Copy Teks`, `Download Kartu PNG`, `Clear Unlocked`, `Clear All`), hidden/offscreen `ExportCard.svelte` for PNG rendering, and non-intrusive toast notifications.

- [ ] **Step 1: Implement `src/utils/exportImage.ts` and `src/components/ExportCard.svelte`**

Design `ExportCard.svelte` as a crisp, high-contrast Clash-styled summary card (TH badge, timestamp/title, Heroes with attached 2 Equipment & Pet, Troops, Super Troops, Spells, Siege) using local images & SVG fallbacks so `toPng` renders cleanly offline without CORS errors.

- [ ] **Step 2: Implement `src/components/LoadoutPanel.svelte`**

Render structured Hero cards (`X / maxActiveHeroes`), each showing its 2 Equipment slots (with `↻`, `🔒`, `×` per equipment) and 1 Pet slot (for TH14+, with `↻`, `🔒`, `×`), plus Hero-level `↻`, `🔒`, `×`. Show Unpaired Equipment & Unpaired Pets rows only when non-empty. Wire `Copy Teks` (`navigator.clipboard.writeText` + toast confirmation) and `Download Kartu PNG`.

- [ ] **Step 3: Implement `src/app.css`, `src/App.svelte`, and `src/main.ts`**

- `src/app.css`: `@import "tailwindcss";` + Clash dark obsidian/gold/royal-purple custom theme tokens and clean custom scrollbars.
- `src/main.ts`: `mount(App, { target: document.getElementById('app')! })`.
- `src/App.svelte`: Full layout + smooth scroll to wheel when `startSlotRespin` is triggered on mobile + toast banner.

- [ ] **Step 4: Run full automated verification (`vitest`, `svelte-check`, `vite build`)**

Run: `npx vitest run && npx svelte-check && npm run build`  
Expected: All unit tests PASS, `svelte-check` reports 0 errors/warnings, and `vite build` produces a clean static `dist/` bundle.

- [ ] **Step 5: Run live browser smoke verification**

Start dev server (`npm run dev`), inspect the live app in the browser across desktop and mobile viewports, and verify:
1. TH19 default loads all 7 categories including `Dragon Duke`, `Fire Heart`, `Greedy Raven`, `Heroic Spell`, `Meteor Golem`.
2. Troop role filter toggles (`All OFF` → `Main` + `Support` OR → `Tank` + `Main` AND → reset) dynamically update wheel slices and pool count.
3. Bidirectional Hero ↔ Equipment flow: spin Hero #1 → switch to Equipment (auto-ON relevant) → spin 2 Equipment → switch back to Heroes (shows remaining Heroes without empty trap!) → test Equipment-first flow too.
4. Per-slot `↻` Re-spin animates the wheel and replaces the exact slot; Hero `×` removes unlocked equipment while preserving locked equipment & Pet; `Copy Teks` and `Download Kartu PNG` succeed cleanly with zero console errors.

- [ ] **Step 6: Commit**

```bash
git add src/utils/exportImage.ts src/components/ExportCard.svelte src/components/LoadoutPanel.svelte src/App.svelte src/app.css src/main.ts
git commit -m "feat: add LoadoutPanel, PNG export card, App layout, and complete CoC Attack Spin app"
```
