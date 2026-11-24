import type { TownHallConfig } from './types';

/**
 * Clash of Clans Town Hall 1–19 progression & realistic attack slot limits (2026 Hero Hall era).
 * Hero Hall unlocks:
 * - TH4  (Hero Hall 1): Barbarian King (1 hero unlocked -> max 1 active)
 * - TH8  (Hero Hall 2): Archer Queen   (2 heroes unlocked -> max 2 active)
 * - TH9  (Hero Hall 3): Minion Prince  (3 heroes unlocked -> max 3 active)
 * - TH11 (Hero Hall 5): Grand Warden   (4 heroes unlocked -> max 4 active)
 * - TH13 (Hero Hall 7): Royal Champion (5 heroes unlocked -> max 4 active)
 * - TH15 (Hero Hall 9): Dragon Duke    (6 heroes unlocked -> max 4 active)
 * Pet House unlocks at TH14 (max 4 active pets, 1 per active hero).
 * Super Troops unlock at TH11 (max 2 active).
 * Siege Machines usable via Clan Castle Lv6+ from TH10 (Workshop from TH12), max 1 per attack.
 * Blacksmith unlocks at TH8.
 */
function buildTownHallConfig(level: number): TownHallConfig {
  let maxActiveHeroes = 0;
  if (level >= 11) maxActiveHeroes = 4;
  else if (level >= 9) maxActiveHeroes = 3;
  else if (level >= 8) maxActiveHeroes = 2;
  else if (level >= 4) maxActiveHeroes = 1;

  return {
    level,
    maxActiveHeroes,
    maxPets: level >= 14 ? 4 : 0,
    maxSuperTroops: level >= 11 ? 2 : 0,
    maxSiege: level >= 10 ? 1 : 0,
    blacksmithUnlocked: level >= 8,
  };
}

export const MIN_TOWN_HALL = 1;
export const MAX_TOWN_HALL = 19;

export const TOWN_HALLS: readonly TownHallConfig[] = Array.from(
  { length: MAX_TOWN_HALL },
  (_, index) => buildTownHallConfig(index + 1),
);

export function getTownHallConfig(th: number): TownHallConfig {
  const clamped = Math.max(MIN_TOWN_HALL, Math.min(MAX_TOWN_HALL, Math.floor(th)));
  return TOWN_HALLS[clamped - 1];
}
