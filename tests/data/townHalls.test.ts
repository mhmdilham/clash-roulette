import { describe, it, expect } from 'vitest';
import { TOWN_HALLS, getTownHallConfig } from '../../src/data/townHalls';

describe('townHalls config (TH1-TH19)', () => {
  it('defines contiguous TH1 through TH19', () => {
    expect(TOWN_HALLS).toHaveLength(19);
    expect(TOWN_HALLS.map((t) => t.level)).toEqual(Array.from({ length: 19 }, (_, i) => i + 1));
  });

  it('caps active heroes at max 4 and pets at 0 before TH14, 4 from TH14+', () => {
    expect(getTownHallConfig(1).maxActiveHeroes).toBe(0);
    expect(getTownHallConfig(3).maxActiveHeroes).toBe(0);
    expect(getTownHallConfig(4).maxActiveHeroes).toBe(1);
    expect(getTownHallConfig(8).maxActiveHeroes).toBe(2);
    expect(getTownHallConfig(9).maxActiveHeroes).toBe(3);
    expect(getTownHallConfig(11).maxActiveHeroes).toBe(4);
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
