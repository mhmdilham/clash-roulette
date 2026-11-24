import { describe, it, expect } from 'vitest';
import {
  createEmptyLoadout,
  applySpinResult,
  slotTargetExists,
} from '../../src/engine/loadoutRules';
import { getItemById } from '../../src/data';

function mustItem(id: string) {
  const item = getItemById(id);
  if (!item) throw new Error(`Missing item ${id}`);
  return item;
}

describe('slotTargetExists (RevealBanner stale target guard)', () => {
  it('returns false when a paired equipment slot moved to another hero or unpaired during cross-hero re-spin', () => {
    let loadout = createEmptyLoadout();
    loadout = applySpinResult(loadout, mustItem('barbarian-king'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('giant-gauntlet'), { realisticLimits: true });

    const hero = loadout.heroes[0];
    const oldTarget = {
      kind: 'pairedEquipment' as const,
      heroUid: hero.uid,
      equipUid: hero.equipment[0].uid,
    };
    expect(slotTargetExists(loadout, oldTarget)).toBe(true);

    // Re-spin with relevance OFF onto Dragon Duke's equipment -> detached from BK into unpairedEquipment
    loadout = applySpinResult(loadout, mustItem('fire-heart'), {
      realisticLimits: true,
      replaceTarget: {
        category: 'equipment',
        target: oldTarget,
        currentItemId: 'giant-gauntlet',
        currentItemName: 'Giant Gauntlet',
      },
    });
    expect(slotTargetExists(loadout, oldTarget)).toBe(false);
    expect(loadout.unpairedEquipment.map((e) => e.itemId)).toEqual(['fire-heart']);
  });
});
