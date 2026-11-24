export type CategoryId =
  | 'troops'
  | 'superTroops'
  | 'siegeMachines'
  | 'spells'
  | 'heroes'
  | 'equipment'
  | 'pets';

export type HeroId =
  | 'barbarian-king'
  | 'archer-queen'
  | 'minion-prince'
  | 'grand-warden'
  | 'royal-champion'
  | 'dragon-duke';

export type TroopRole =
  | 'Main'
  | 'Support'
  | 'Tank'
  | 'Damage Dealer'
  | 'Funnel'
  | 'Clean-up';

export const ALL_TROOP_ROLES: readonly TroopRole[] = [
  'Main',
  'Support',
  'Tank',
  'Damage Dealer',
  'Funnel',
  'Clean-up',
] as const;

export type MovementType = 'ground' | 'air';
export type MovementFilter = 'all' | MovementType;
export type ResourceType = 'elixir' | 'dark';
export type EquipmentRarity = 'common' | 'epic';
export type MatchMode = 'OR' | 'AND';

export interface BaseSpinItem {
  id: string;
  name: string;
  category: CategoryId;
  unlockTh: number;
  iconPath: string;
}

export interface TroopItem extends BaseSpinItem {
  category: 'troops';
  resource: ResourceType;
  movement: MovementType;
  roles: readonly TroopRole[];
}

export interface SuperTroopItem extends BaseSpinItem {
  category: 'superTroops';
  resource: ResourceType;
  movement: MovementType;
  roles: readonly TroopRole[];
  baseTroopId: string;
}

export interface SiegeMachineItem extends BaseSpinItem {
  category: 'siegeMachines';
}

export interface SpellItem extends BaseSpinItem {
  category: 'spells';
  resource: ResourceType;
}

export interface HeroItem extends BaseSpinItem {
  id: HeroId;
  category: 'heroes';
  movement: MovementType;
}

export interface EquipmentItem extends BaseSpinItem {
  category: 'equipment';
  heroId: HeroId;
  rarity: EquipmentRarity;
}

export interface PetItem extends BaseSpinItem {
  category: 'pets';
}

export type SpinItem =
  | TroopItem
  | SuperTroopItem
  | SiegeMachineItem
  | SpellItem
  | HeroItem
  | EquipmentItem
  | PetItem;

export interface TownHallConfig {
  level: number;
  maxActiveHeroes: number;
  maxPets: number;
  maxSuperTroops: number;
  maxSiege: number;
  blacksmithUnlocked: boolean;
}

export interface EquipmentEntry {
  uid: string;
  itemId: string;
  heroId: HeroId;
  locked: boolean;
}

export interface PetEntry {
  uid: string;
  itemId: string;
  locked: boolean;
}

export interface HeroSlot {
  uid: string;
  heroId: HeroId;
  locked: boolean;
  equipment: EquipmentEntry[];
  pet: PetEntry | null;
}

export interface ArmyEntry {
  uid: string;
  itemId: string;
  locked: boolean;
}

export interface LoadoutState {
  heroes: HeroSlot[];
  unpairedEquipment: EquipmentEntry[];
  unpairedPets: PetEntry[];
  troops: ArmyEntry[];
  superTroops: ArmyEntry[];
  spells: ArmyEntry[];
  siegeMachines: ArmyEntry[];
}

export interface FilterState {
  roles: TroopRole[];
  matchMode: MatchMode;
  movement: MovementFilter;
  includeCcSiege: boolean;
  realisticLimits: boolean;
  antiDuplicate: boolean;
  /** null = auto-default based on loadout, true/false = explicit manual override */
  equipRelevanceOverride: boolean | null;
  heroRelevanceOverride: boolean | null;
}

export type SlotTarget =
  | { kind: 'hero'; heroUid: string }
  | { kind: 'pairedEquipment'; heroUid: string; equipUid: string }
  | { kind: 'unpairedEquipment'; equipUid: string }
  | { kind: 'pairedPet'; heroUid: string }
  | { kind: 'unpairedPet'; petUid: string }
  | { kind: 'troop'; uid: string }
  | { kind: 'superTroop'; uid: string }
  | { kind: 'spell'; uid: string }
  | { kind: 'siege'; uid: string };

export interface ReplaceTarget {
  category: CategoryId;
  target: SlotTarget;
  currentItemId: string;
  currentItemName: string;
  /** Set when re-spinning an equipment slot paired to a specific hero */
  scopedHeroId?: HeroId;
  /** Set when re-spinning a hero so any locked equipment detached from that hero doesn't trap the Hero wheel */
  ignoreUnpairedHeroId?: HeroId;
}
