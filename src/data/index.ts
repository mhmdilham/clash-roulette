import type { CategoryId, HeroId, HeroItem, SpinItem } from './types';
import { HEROES } from './heroes';
import { EQUIPMENT } from './equipment';
import { PETS } from './pets';
import { TROOPS } from './troops';
import { SUPER_TROOPS } from './superTroops';
import { SPELLS } from './spells';
import { SIEGE_MACHINES } from './siegeMachines';

export * from './types';
export * from './townHalls';
export { HEROES, EQUIPMENT, PETS, TROOPS, SUPER_TROOPS, SPELLS, SIEGE_MACHINES };

export const CATEGORIES: readonly { id: CategoryId; label: string; shortLabel: string }[] = [
  { id: 'troops', label: 'Troops', shortLabel: 'Troops' },
  { id: 'superTroops', label: 'Super Troops', shortLabel: 'Super' },
  { id: 'siegeMachines', label: 'Siege Machines', shortLabel: 'Siege' },
  { id: 'spells', label: 'Spells', shortLabel: 'Spells' },
  { id: 'heroes', label: 'Heroes', shortLabel: 'Heroes' },
  { id: 'equipment', label: 'Equipment', shortLabel: 'Equip' },
  { id: 'pets', label: 'Pets', shortLabel: 'Pets' },
] as const;

export const ALL_ITEMS: readonly SpinItem[] = [
  ...TROOPS,
  ...SUPER_TROOPS,
  ...SIEGE_MACHINES,
  ...SPELLS,
  ...HEROES,
  ...EQUIPMENT,
  ...PETS,
];

const ITEMS_BY_ID = new Map<string, SpinItem>(ALL_ITEMS.map((item) => [item.id, item]));
const HEROES_BY_ID = new Map<HeroId, HeroItem>(HEROES.map((hero) => [hero.id, hero]));

export function getItemsByCategory(category: CategoryId): readonly SpinItem[] {
  switch (category) {
    case 'troops':
      return TROOPS;
    case 'superTroops':
      return SUPER_TROOPS;
    case 'siegeMachines':
      return SIEGE_MACHINES;
    case 'spells':
      return SPELLS;
    case 'heroes':
      return HEROES;
    case 'equipment':
      return EQUIPMENT;
    case 'pets':
      return PETS;
  }
}

export function getItemById(id: string): SpinItem | undefined {
  return ITEMS_BY_ID.get(id);
}

export function getHeroById(id: HeroId): HeroItem | undefined {
  return HEROES_BY_ID.get(id);
}

export function isItemUnlockedAtTh(item: SpinItem, th: number, includeCcSiege: boolean): boolean {
  if (item.category === 'siegeMachines' && includeCcSiege && th >= 10) {
    return true;
  }
  return item.unlockTh <= th;
}

export function getAvailableCategories(th: number, includeCcSiege: boolean): CategoryId[] {
  return CATEGORIES.map((c) => c.id).filter((category) =>
    getItemsByCategory(category).some((item) => isItemUnlockedAtTh(item, th, includeCcSiege)),
  );
}
