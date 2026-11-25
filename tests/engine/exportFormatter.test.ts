import { describe, it, expect } from 'vitest';
import { createEmptyLoadout, applySpinResult } from '../../src/engine/loadoutRules';
import { formatLoadoutText } from '../../src/engine/exportFormatter';
import { getItemById } from '../../src/data';

function mustItem(id: string) {
  const item = getItemById(id);
  if (!item) throw new Error(`Missing item ${id}`);
  return item;
}

describe('formatLoadoutText', () => {
  it('formats complete TH19 loadout cleanly for WhatsApp/Discord and omits empty sections', () => {
    let loadout = createEmptyLoadout();
    loadout = applySpinResult(loadout, mustItem('dragon-duke'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('fire-heart'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('flame-blower'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('sneezy'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('root-rider'), { realisticLimits: true });
    loadout = applySpinResult(loadout, mustItem('heroic-spell'), { realisticLimits: true });

    const text = formatLoadoutText(loadout, 19);
    expect(text).toContain('TH19');
    expect(text).toContain('Dragon Duke');
    expect(text).toContain('Fire Heart, Flame Blower');
    expect(text).toContain('Sneezy');
    expect(text).toContain('Root Rider');
    expect(text).toContain('Heroic Spell');
    expect(text).not.toContain('Siege');
    expect(text).not.toContain('Super Troops');

    const textEn = formatLoadoutText(loadout, 19, 'en');
    expect(textEn).toContain('Clash Roulette');
    expect(textEn).toContain('TH19');
  });
});
