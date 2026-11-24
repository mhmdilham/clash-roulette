import { describe, it, expect } from 'vitest';
import {
  computeEligiblePool,
  getEffectiveRelevance,
  getPrimaryDisplayRole,
} from '../../src/engine/poolFilter';
import type { FilterState, LoadoutState } from '../../src/data/types';

function emptyLoadout(): LoadoutState {
  return {
    heroes: [],
    unpairedEquipment: [],
    unpairedPets: [],
    troops: [],
    superTroops: [],
    spells: [],
    siegeMachines: [],
  };
}

function defaultFilters(overrides: Partial<FilterState> = {}): FilterState {
  return {
    roles: [],
    matchMode: 'OR',
    movement: 'all',
    includeCcSiege: true,
    realisticLimits: true,
    antiDuplicate: true,
    equipRelevanceOverride: null,
    heroRelevanceOverride: null,
    ...overrides,
  };
}

describe('computeEligiblePool — Troop & Super Troop role filters', () => {
  it('returns full TH unlocked troops when all role filters are OFF', () => {
    const res = computeEligiblePool({
      townHall: 19,
      category: 'troops',
      loadout: emptyLoadout(),
      filters: defaultFilters(),
    });
    expect(res.items.length).toBe(res.totalAtTh);
    expect(res.items.length).toBeGreaterThanOrEqual(30);
    expect(res.emptyReason).toBeNull();
  });

  it('matches union (OR) for Main + Support', () => {
    const res = computeEligiblePool({
      townHall: 19,
      category: 'troops',
      loadout: emptyLoadout(),
      filters: defaultFilters({ roles: ['Main', 'Support'], matchMode: 'OR' }),
    });
    const ids = new Set(res.items.map((i) => i.id));
    expect(ids.has('root-rider')).toBe(true); // Main + Tank + Support
    expect(ids.has('healer')).toBe(true); // Support
    expect(ids.has('hog-rider')).toBe(true); // Main + Damage Dealer
    expect(ids.has('wizard')).toBe(false); // Damage Dealer + Funnel + Clean-up
  });

  it('matches intersection (AND) for Tank + Main', () => {
    const res = computeEligiblePool({
      townHall: 19,
      category: 'troops',
      loadout: emptyLoadout(),
      filters: defaultFilters({ roles: ['Tank', 'Main'], matchMode: 'AND' }),
    });
    const ids = new Set(res.items.map((i) => i.id));
    expect(ids.has('root-rider')).toBe(true);
    expect(ids.has('meteor-golem')).toBe(true);
    expect(ids.has('golem')).toBe(false); // Tank + Support (not Main)
    expect(ids.has('healer')).toBe(false);
  });

  it('combines movement filter and reports no-role-match when impossible', () => {
    const airTanks = computeEligiblePool({
      townHall: 19,
      category: 'troops',
      loadout: emptyLoadout(),
      filters: defaultFilters({ roles: ['Tank'], movement: 'air' }),
    });
    expect(airTanks.items.map((i) => i.id)).toEqual(['lava-hound']);

    const impossible = computeEligiblePool({
      townHall: 19,
      category: 'troops',
      loadout: emptyLoadout(),
      filters: defaultFilters({ roles: ['Tank', 'Clean-up'], matchMode: 'AND', movement: 'air' }),
    });
    expect(impossible.items).toEqual([]);
    expect(impossible.emptyReason).toBe('no-role-match');
  });

  it('applies role filters to Super Troops too', () => {
    const res = computeEligiblePool({
      townHall: 19,
      category: 'superTroops',
      loadout: emptyLoadout(),
      filters: defaultFilters({ roles: ['Tank'], matchMode: 'OR' }),
    });
    const ids = new Set(res.items.map((i) => i.id));
    expect(ids.has('super-yeti')).toBe(true);
    expect(ids.has('super-giant')).toBe(true);
    expect(ids.has('sneaky-goblin')).toBe(false);
  });
});

describe('computeEligiblePool — Siege Machines CC vs Workshop', () => {
  it('enables all sieges at TH10 when includeCcSiege is ON, locks when OFF', () => {
    const ccOn = computeEligiblePool({
      townHall: 10,
      category: 'siegeMachines',
      loadout: emptyLoadout(),
      filters: defaultFilters({ includeCcSiege: true }),
    });
    expect(ccOn.items.length).toBeGreaterThanOrEqual(8);

    const ccOff = computeEligiblePool({
      townHall: 10,
      category: 'siegeMachines',
      loadout: emptyLoadout(),
      filters: defaultFilters({ includeCcSiege: false }),
    });
    expect(ccOff.items).toEqual([]);
    expect(ccOff.emptyReason).toBe('category-locked');

    const th12Workshop = computeEligiblePool({
      townHall: 12,
      category: 'siegeMachines',
      loadout: emptyLoadout(),
      filters: defaultFilters({ includeCcSiege: false }),
    });
    expect(th12Workshop.items.map((i) => i.id)).toEqual([
      'wall-wrecker',
      'battle-blimp',
      'stone-slammer',
    ]);
  });
});

describe('computeEligiblePool — Bidirectional Hero <-> Equipment relevance', () => {
  it('auto-activates equipment relevance when >=1 Hero is chosen and filters strictly to that hero', () => {
    const loadout = emptyLoadout();
    loadout.heroes.push({
      uid: 'h1',
      heroId: 'dragon-duke',
      locked: false,
      equipment: [],
      pet: null,
    });

    const res = computeEligiblePool({
      townHall: 19,
      category: 'equipment',
      loadout,
      filters: defaultFilters(),
    });
    expect(res.relevanceAutoActive).toBe(true);
    expect(res.relevanceEffective).toBe(true);
    expect(res.items.length).toBeGreaterThanOrEqual(3);
    expect(res.items.every((i) => i.category === 'equipment' && i.heroId === 'dragon-duke')).toBe(true);
  });

  it('reports all-heroes-equipped when every chosen hero already has 2/2 equipment', () => {
    const loadout = emptyLoadout();
    loadout.heroes.push({
      uid: 'h1',
      heroId: 'barbarian-king',
      locked: false,
      equipment: [
        { uid: 'e1', itemId: 'giant-gauntlet', heroId: 'barbarian-king', locked: false },
        { uid: 'e2', itemId: 'spiky-ball', heroId: 'barbarian-king', locked: false },
      ],
      pet: null,
    });

    const res = computeEligiblePool({
      townHall: 19,
      category: 'equipment',
      loadout,
      filters: defaultFilters(),
    });
    expect(res.items).toEqual([]);
    expect(res.emptyReason).toBe('all-heroes-equipped');
  });

  it('supports seamless Hero #1 -> Equipment -> Hero #2 flow without trapping Hero wheel', () => {
    const loadout = emptyLoadout();
    loadout.heroes.push({
      uid: 'h1',
      heroId: 'barbarian-king',
      locked: false,
      equipment: [
        { uid: 'e1', itemId: 'giant-gauntlet', heroId: 'barbarian-king', locked: false },
        { uid: 'e2', itemId: 'spiky-ball', heroId: 'barbarian-king', locked: false },
      ],
      pet: null,
    });

    const res = computeEligiblePool({
      townHall: 19,
      category: 'heroes',
      loadout,
      filters: defaultFilters(),
    });
    expect(res.relevanceAutoActive).toBe(false);
    expect(res.relevanceEffective).toBe(false);
    expect(res.items.map((h) => h.id)).toHaveLength(5);
    expect(res.items.map((h) => h.id)).not.toContain('barbarian-king');
  });

  it('auto-activates hero relevance when unpaired equipment exists and restricts to owning hero', () => {
    const loadout = emptyLoadout();
    loadout.unpairedEquipment.push({
      uid: 'ue1',
      itemId: 'fire-heart',
      heroId: 'dragon-duke',
      locked: false,
    });

    const res = computeEligiblePool({
      townHall: 19,
      category: 'heroes',
      loadout,
      filters: defaultFilters(),
    });
    expect(res.relevanceAutoActive).toBe(true);
    expect(res.relevanceEffective).toBe(true);
    expect(res.items.map((h) => h.id)).toEqual(['dragon-duke']);
  });

  it('keeps per-direction relevance overrides independent', () => {
    const loadout = emptyLoadout();
    loadout.heroes.push({
      uid: 'h1',
      heroId: 'barbarian-king',
      locked: false,
      equipment: [],
      pet: null,
    });
    loadout.unpairedEquipment.push({
      uid: 'ue1',
      itemId: 'fire-heart',
      heroId: 'dragon-duke',
      locked: false,
    });

    const filters = defaultFilters({ heroRelevanceOverride: false, equipRelevanceOverride: null });
    expect(getEffectiveRelevance('heroes', loadout, filters).effective).toBe(false);
    expect(getEffectiveRelevance('equipment', loadout, filters).effective).toBe(true);
  });
});

describe('computeEligiblePool — Realistic TH limits & Replacement scoping', () => {
  it('enforces TH hero/pet/super/siege caps when realisticLimits is ON and relaxes when OFF', () => {
    const loadout = emptyLoadout();
    loadout.heroes = [
      { uid: '1', heroId: 'barbarian-king', locked: false, equipment: [], pet: null },
      { uid: '2', heroId: 'archer-queen', locked: false, equipment: [], pet: null },
      { uid: '3', heroId: 'grand-warden', locked: false, equipment: [], pet: null },
      { uid: '4', heroId: 'royal-champion', locked: false, equipment: [], pet: null },
    ];

    const capped = computeEligiblePool({
      townHall: 19,
      category: 'heroes',
      loadout,
      filters: defaultFilters({ realisticLimits: true }),
    });
    expect(capped.items).toEqual([]);
    expect(capped.emptyReason).toBe('slot-full');
    expect(capped.slotUsage).toEqual({ used: 4, max: 4 });

    const uncapped = computeEligiblePool({
      townHall: 19,
      category: 'heroes',
      loadout,
      filters: defaultFilters({ realisticLimits: false }),
    });
    expect(uncapped.items.map((h) => h.id)).toEqual(['minion-prince', 'dragon-duke']);
  });

  it('scopes paired equipment re-spin strictly to that hero and excludes current item', () => {
    const loadout = emptyLoadout();
    loadout.heroes = [
      {
        uid: 'h1',
        heroId: 'barbarian-king',
        locked: false,
        equipment: [
          { uid: 'e1', itemId: 'giant-gauntlet', heroId: 'barbarian-king', locked: false },
          { uid: 'e2', itemId: 'spiky-ball', heroId: 'barbarian-king', locked: false },
        ],
        pet: null,
      },
      {
        uid: 'h2',
        heroId: 'archer-queen',
        locked: false,
        equipment: [],
        pet: null,
      },
    ];

    const res = computeEligiblePool({
      townHall: 19,
      category: 'equipment',
      loadout,
      filters: defaultFilters(),
      replaceTarget: {
        category: 'equipment',
        target: { kind: 'pairedEquipment', heroUid: 'h1', equipUid: 'e1' },
        currentItemId: 'giant-gauntlet',
        currentItemName: 'Giant Gauntlet',
        scopedHeroId: 'barbarian-king',
      },
    });
    expect(res.emptyReason).toBeNull();
    expect(res.items.every((i) => i.category === 'equipment' && i.heroId === 'barbarian-king')).toBe(true);
    expect(res.items.map((i) => i.id)).not.toContain('giant-gauntlet');
    expect(res.items.map((i) => i.id)).not.toContain('spiky-ball');
  });

  it('does not trap Hero re-spin when replaced Hero has a locked equipment in unpairedEquipment', () => {
    const loadout = emptyLoadout();
    loadout.heroes = [
      { uid: 'h1', heroId: 'barbarian-king', locked: false, equipment: [], pet: null },
      { uid: 'h2', heroId: 'archer-queen', locked: false, equipment: [], pet: null },
      { uid: 'h3', heroId: 'grand-warden', locked: false, equipment: [], pet: null },
      { uid: 'h4', heroId: 'royal-champion', locked: false, equipment: [], pet: null },
    ];
    loadout.unpairedEquipment.push({
      uid: 'e-lock',
      itemId: 'giant-gauntlet',
      heroId: 'barbarian-king',
      locked: true,
    });

    const res = computeEligiblePool({
      townHall: 19,
      category: 'heroes',
      loadout,
      filters: defaultFilters(),
      replaceTarget: {
        category: 'heroes',
        target: { kind: 'hero', heroUid: 'h1' },
        currentItemId: 'barbarian-king',
        currentItemName: 'Barbarian King',
        ignoreUnpairedHeroId: 'barbarian-king',
      },
    });
    expect(res.emptyReason).toBeNull();
    expect(res.items.map((h) => h.id)).toEqual(['minion-prince', 'dragon-duke']);
  });
});

describe('getPrimaryDisplayRole', () => {
  it('returns the unit primary role (first role) when no filter roles are active', () => {
    expect(getPrimaryDisplayRole(['Main', 'Tank', 'Support'], [])).toBe('Main');
    expect(getPrimaryDisplayRole(['Damage Dealer', 'Funnel', 'Clean-up'], [])).toBe('Damage Dealer');
  });

  it('prefers the closest matching active filter role when present', () => {
    expect(getPrimaryDisplayRole(['Main', 'Tank', 'Support'], ['Tank'])).toBe('Tank');
    expect(getPrimaryDisplayRole(['Main', 'Tank', 'Support'], ['Support', 'Funnel'])).toBe('Support');
  });

  it('falls back to primary role if active filter does not match unit roles', () => {
    expect(getPrimaryDisplayRole(['Support', 'Tank'], ['Clean-up'])).toBe('Support');
  });
});
