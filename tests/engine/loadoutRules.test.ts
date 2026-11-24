import { describe, it, expect } from 'vitest';
import {
  createEmptyLoadout,
  applySpinResult,
  removeLoadoutItem,
  toggleSlotLock,
  clearUnlockedLoadout,
  pruneLoadoutForTownHall,
} from '../../src/engine/loadoutRules';
import { getItemById } from '../../src/data';

function mustItem(id: string) {
  const item = getItemById(id);
  if (!item) throw new Error(`Missing test item: ${id}`);
  return item;
}

describe('loadoutRules — Hero, Equipment & Pet pairing', () => {
  it('attaches equipment to owning Hero up to 2 when realisticLimits ON, overflow to unpaired', () => {
    let loadout = createEmptyLoadout();
    loadout = applySpinResult(loadout, mustItem('barbarian-king'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('giant-gauntlet'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('spiky-ball'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('rage-vial'), { realisticLimits: true });

    expect(loadout.heroes[0].equipment.map((e) => e.itemId)).toEqual([
      'giant-gauntlet',
      'spiky-ball',
    ]);
    expect(loadout.unpairedEquipment.map((e) => e.itemId)).toEqual(['rage-vial']);
  });

  it('auto-pulls matching unpaired equipment and unpaired pet when Hero is spun later', () => {
    let loadout = createEmptyLoadout();
    loadout = applySpinResult(loadout, mustItem('fire-heart'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('flame-blower'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('greedy-raven'), { realisticLimits: true });

    expect(loadout.unpairedEquipment).toHaveLength(2);
    expect(loadout.unpairedPets).toHaveLength(1);

    loadout = applySpinResult(loadout, mustItem('dragon-duke'), { realisticLimits: true });
    expect(loadout.heroes).toHaveLength(1);
    expect(loadout.heroes[0].equipment.map((e) => e.itemId)).toEqual([
      'fire-heart',
      'flame-blower',
    ]);
    expect(loadout.heroes[0].pet?.itemId).toBe('greedy-raven');
    expect(loadout.unpairedEquipment).toHaveLength(0);
    expect(loadout.unpairedPets).toHaveLength(0);
  });

  it('Decision 2A: removing Hero deletes unlocked equipment, detaches locked equipment, moves Pet to unpaired', () => {
    let loadout = createEmptyLoadout();
    loadout = applySpinResult(loadout, mustItem('barbarian-king'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('giant-gauntlet'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('spiky-ball'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('mighty-yak'), { realisticLimits: true });

    const hero = loadout.heroes[0];
    // Lock giant-gauntlet only
    loadout = toggleSlotLock(loadout, {
      kind: 'pairedEquipment',
      heroUid: hero.uid,
      equipUid: hero.equipment[0].uid,
    });

    loadout = removeLoadoutItem(loadout, { kind: 'hero', heroUid: hero.uid });

    expect(loadout.heroes).toHaveLength(0);
    expect(loadout.unpairedEquipment.map((e) => e.itemId)).toEqual(['giant-gauntlet']);
    expect(loadout.unpairedEquipment[0].locked).toBe(true);
    expect(loadout.unpairedPets.map((p) => p.itemId)).toEqual(['mighty-yak']);
  });

  it('Decision 2A: re-spinning Hero deletes unlocked equipment, detaches locked equipment, keeps Pet on slot, pulls new Hero unpaired equipment', () => {
    let loadout = createEmptyLoadout();
    loadout = applySpinResult(loadout, mustItem('barbarian-king'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('giant-gauntlet'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('spiky-ball'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('mighty-yak'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('fire-heart'), { realisticLimits: true });

    const hero = loadout.heroes[0];
    loadout = toggleSlotLock(loadout, {
      kind: 'pairedEquipment',
      heroUid: hero.uid,
      equipUid: hero.equipment[0].uid,
    });

    loadout = applySpinResult(loadout, mustItem('dragon-duke'), {
      realisticLimits: true,
      replaceTarget: {
        category: 'heroes',
        target: { kind: 'hero', heroUid: hero.uid },
        currentItemId: 'barbarian-king',
        currentItemName: 'Barbarian King',
        ignoreUnpairedHeroId: 'barbarian-king',
      },
    });

    expect(loadout.heroes).toHaveLength(1);
    expect(loadout.heroes[0].heroId).toBe('dragon-duke');
    expect(loadout.heroes[0].pet?.itemId).toBe('mighty-yak');
    expect(loadout.heroes[0].equipment.map((e) => e.itemId)).toEqual(['fire-heart']);
    expect(loadout.unpairedEquipment.map((e) => e.itemId)).toEqual(['giant-gauntlet']);
  });

  it('replaces paired equipment and army slots in place', () => {
    let loadout = createEmptyLoadout();
    loadout = applySpinResult(loadout, mustItem('barbarian-king'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('giant-gauntlet'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('root-rider'), { realisticLimits: true });

    const hero = loadout.heroes[0];
    const eqUid = hero.equipment[0].uid;
    const troopUid = loadout.troops[0].uid;

    loadout = applySpinResult(loadout, mustItem('stick-horse'), {
      realisticLimits: true,
      replaceTarget: {
        category: 'equipment',
        target: { kind: 'pairedEquipment', heroUid: hero.uid, equipUid: eqUid },
        currentItemId: 'giant-gauntlet',
        currentItemName: 'Giant Gauntlet',
        scopedHeroId: 'barbarian-king',
      },
    });
    expect(loadout.heroes[0].equipment[0].itemId).toBe('stick-horse');

    loadout = applySpinResult(loadout, mustItem('meteor-golem'), {
      realisticLimits: true,
      replaceTarget: {
        category: 'troops',
        target: { kind: 'troop', uid: troopUid },
        currentItemId: 'root-rider',
        currentItemName: 'Root Rider',
      },
    });
    expect(loadout.troops[0].itemId).toBe('meteor-golem');
  });

  it('clearUnlockedLoadout preserves locked heroes/equipment/pets/troops and clears unlocked', () => {
    let loadout = createEmptyLoadout();
    loadout = applySpinResult(loadout, mustItem('barbarian-king'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('archer-queen'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('giant-gauntlet'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('root-rider'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('healer'), { realisticLimits: true });

    loadout = toggleSlotLock(loadout, { kind: 'hero', heroUid: loadout.heroes[0].uid });
    loadout = toggleSlotLock(loadout, { kind: 'troop', uid: loadout.troops[0].uid });

    const cleared = clearUnlockedLoadout(loadout);
    expect(cleared.heroes.map((h) => h.heroId)).toEqual(['barbarian-king']);
    expect(cleared.heroes[0].equipment).toHaveLength(0);
    expect(cleared.troops.map((t) => t.itemId)).toEqual(['root-rider']);
  });

  it('Review Focus #3: TH downgrade prunes locked higher-TH items, excess hero slots, pets, and dangling hero equipment', () => {
    let loadout = createEmptyLoadout();
    loadout = applySpinResult(loadout, mustItem('dragon-duke'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('fire-heart'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('greedy-raven'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('barbarian-king'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('archer-queen'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('grand-warden'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('meteor-golem'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('heroic-spell'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('dragon'), { realisticLimits: true });

    // Lock Dragon Duke & Fire Heart to verify TH prune overrides locks
    loadout = toggleSlotLock(loadout, { kind: 'hero', heroUid: loadout.heroes[0].uid });
    loadout = toggleSlotLock(loadout, {
      kind: 'pairedEquipment',
      heroUid: loadout.heroes[0].uid,
      equipUid: loadout.heroes[0].equipment[0].uid,
    });

    const { loadout: pruned, removedNames } = pruneLoadoutForTownHall(loadout, 8, true);
    expect(pruned.heroes.map((h) => h.heroId)).toEqual(['barbarian-king', 'archer-queen']);
    expect(pruned.unpairedEquipment).toHaveLength(0);
    expect(pruned.unpairedPets).toHaveLength(0);
    expect(pruned.troops.map((t) => t.itemId)).toEqual(['dragon']);
    expect(pruned.spells).toHaveLength(0);
    expect(removedNames).toEqual(
      expect.arrayContaining([
        'Dragon Duke',
        'Fire Heart',
        'Greedy Raven',
        'Grand Warden',
        'Meteor Golem',
        'Heroic Spell',
      ]),
    );
  });

  it('preserves >4 heroes and >1 siege when enforceCaps is false (sandbox mode) while still pruning locked TH items', () => {
    let loadout = createEmptyLoadout();
    for (const id of [
      'barbarian-king',
      'archer-queen',
      'minion-prince',
      'grand-warden',
      'royal-champion',
      'dragon-duke',
    ]) {
      loadout = applySpinResult(loadout, mustItem(id), { realisticLimits: false });
    }
    loadout = applySpinResult(loadout, mustItem('wall-wrecker'), { realisticLimits: false });
    loadout = applySpinResult(loadout, mustItem('battle-blimp'), { realisticLimits: false });

    const { loadout: pruned, removedNames } = pruneLoadoutForTownHall(loadout, 14, true, false);
    // Dragon Duke (TH15) is pruned, but all 5 unlocked heroes (TH<=14) and both sieges survive in sandbox mode
    expect(pruned.heroes.map((h) => h.heroId)).toHaveLength(5);
    expect(pruned.siegeMachines).toHaveLength(2);
    expect(removedNames).toContain('Dragon Duke');
  });
});
