import { describe, it, expect } from 'vitest';
import {
  STORAGE_KEY,
  createDefaultPersistedState,
  loadPersistedState,
  savePersistedState,
} from '../../src/stores/persistence';

function makeMemoryStorage(initial?: Record<string, string>) {
  const map = new Map<string, string>(Object.entries(initial ?? {}));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

describe('persistence', () => {
  it('round-trips valid persisted state cleanly', () => {
    const storage = makeMemoryStorage();
    const state = createDefaultPersistedState();
    state.townHall = 15;
    state.activeCategory = 'heroes';
    state.fastSpin = true;
    state.loadout.heroes.push({
      uid: 'h1',
      heroId: 'dragon-duke',
      locked: true,
      equipment: [{ uid: 'e1', itemId: 'fire-heart', heroId: 'dragon-duke', locked: false }],
      pet: { uid: 'p1', itemId: 'phoenix', locked: false },
    });

    savePersistedState(state, storage);
    const loaded = loadPersistedState(storage);

    expect(loaded.townHall).toBe(15);
    expect(loaded.activeCategory).toBe('heroes');
    expect(loaded.fastSpin).toBe(true);
    expect(loaded.loadout.heroes).toHaveLength(1);
    expect(loaded.loadout.heroes[0].heroId).toBe('dragon-duke');
    expect(loaded.loadout.heroes[0].equipment[0].itemId).toBe('fire-heart');
    expect(loaded.loadout.heroes[0].pet?.itemId).toBe('phoenix');
  });

  it('Review Focus #4: falls back cleanly on malformed JSON or wrong schema version', () => {
    const corrupt = makeMemoryStorage({ [STORAGE_KEY]: '{not valid json' });
    expect(loadPersistedState(corrupt).townHall).toBe(19);

    const wrongVersion = makeMemoryStorage({
      [STORAGE_KEY]: JSON.stringify({ version: 999, townHall: 5 }),
    });
    expect(loadPersistedState(wrongVersion).townHall).toBe(19);
  });

  it('Review Focus #4: strips unknown/stale item IDs and invalid category for TH', () => {
    const stale = makeMemoryStorage({
      [STORAGE_KEY]: JSON.stringify({
        version: 1,
        townHall: 10,
        activeCategory: 'pets', // unavailable at TH10!
        filters: {
          roles: ['Main', 'NonExistentRole'],
          matchMode: 'AND',
          movement: 'air',
          includeCcSiege: true,
          realisticLimits: true,
          antiDuplicate: true,
          equipRelevanceOverride: null,
          heroRelevanceOverride: null,
        },
        loadout: {
          heroes: [
            {
              uid: 'h-bad',
              heroId: 'fake-hero',
              locked: false,
              equipment: [],
              pet: null,
            },
            {
              uid: 'h-ok',
              heroId: 'barbarian-king',
              locked: false,
              equipment: [
                { uid: 'e-bad', itemId: 'deleted-eq', heroId: 'barbarian-king', locked: false },
                { uid: 'e-ok', itemId: 'giant-gauntlet', heroId: 'barbarian-king', locked: false },
              ],
              pet: null,
            },
          ],
          unpairedEquipment: [],
          unpairedPets: [],
          troops: [
            { uid: 't1', itemId: 'removed-troop-xyz', locked: false },
            { uid: 't2', itemId: 'dragon', locked: false },
          ],
          superTroops: [],
          spells: [],
          siegeMachines: [],
        },
        fastSpin: false,
        soundEnabled: true,
        soundVolume: 0.7,
      }),
    });

    const loaded = loadPersistedState(stale);
    expect(loaded.townHall).toBe(10);
    expect(loaded.activeCategory).toBe('troops');
    expect(loaded.filters.roles).toEqual(['Main']);
    expect(loaded.loadout.heroes.map((h) => h.heroId)).toEqual(['barbarian-king']);
    expect(loaded.loadout.heroes[0].equipment.map((e) => e.itemId)).toEqual(['giant-gauntlet']);
    expect(loaded.loadout.troops.map((t) => t.itemId)).toEqual(['dragon']);
  });

  it('preserves sandbox >4 heroes on reload when realisticLimits is false and deduplicates corrupt duplicate/empty UIDs', () => {
    const storage = makeMemoryStorage({
      [STORAGE_KEY]: JSON.stringify({
        version: 1,
        townHall: 19,
        activeCategory: 'heroes',
        filters: {
          roles: ['Main', 'Main'],
          matchMode: 'OR',
          movement: 'all',
          includeCcSiege: true,
          realisticLimits: false,
          antiDuplicate: true,
          equipRelevanceOverride: null,
          heroRelevanceOverride: null,
        },
        loadout: {
          heroes: [
            { uid: 'dup', heroId: 'barbarian-king', locked: false, equipment: [], pet: null },
            { uid: 'dup', heroId: 'archer-queen', locked: false, equipment: [], pet: null },
            { uid: '', heroId: 'minion-prince', locked: false, equipment: [], pet: null },
            { uid: 'h4', heroId: 'grand-warden', locked: false, equipment: [], pet: null },
            { uid: 'h5', heroId: 'royal-champion', locked: false, equipment: [], pet: null },
            { uid: 'h6', heroId: 'barbarian-king', locked: false, equipment: [], pet: null }, // duplicate heroId
          ],
          unpairedEquipment: [
            { uid: 'dup', itemId: 'fire-heart', heroId: 'dragon-duke', locked: false },
          ],
          unpairedPets: [],
          troops: [
            { uid: 't-dup', itemId: 'dragon', locked: false },
            { uid: 't-dup', itemId: 'healer', locked: false },
          ],
          superTroops: [],
          spells: [],
          siegeMachines: [],
        },
        fastSpin: false,
        soundEnabled: true,
        soundVolume: 0.5,
      }),
    });

    const loaded = loadPersistedState(storage);
    expect(loaded.filters.roles).toEqual(['Main']);
    expect(loaded.loadout.heroes).toHaveLength(5);
    const allUids = [
      ...loaded.loadout.heroes.map((h) => h.uid),
      ...loaded.loadout.unpairedEquipment.map((e) => e.uid),
      ...loaded.loadout.troops.map((t) => t.uid),
    ];
    expect(allUids.every((u) => u.length > 0)).toBe(true);
    expect(new Set(allUids).size).toBe(allUids.length);
  });
});
