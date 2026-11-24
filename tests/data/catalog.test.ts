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
    expect(SPELLS.length).toBeGreaterThanOrEqual(18);
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
    expect(getAvailableCategories(4, true)).toEqual(['troops', 'heroes']);
    expect(getAvailableCategories(10, true)).toContain('siegeMachines');
    expect(getAvailableCategories(10, false)).not.toContain('siegeMachines');
    expect(getAvailableCategories(12, false)).toContain('siegeMachines');
    expect(getAvailableCategories(13, true)).not.toContain('pets');
    expect(getAvailableCategories(14, true)).toContain('pets');
    expect(getAvailableCategories(19, true)).toHaveLength(7);
  });
});
