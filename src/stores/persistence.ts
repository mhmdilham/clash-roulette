import {
  ALL_TROOP_ROLES,
  MAX_TOWN_HALL,
  MIN_TOWN_HALL,
  getAvailableCategories,
  getHeroById,
  getItemById,
} from '../data';
import type {
  ArmyEntry,
  CategoryId,
  EquipmentEntry,
  EquipmentItem,
  FilterState,
  HeroId,
  HeroSlot,
  LoadoutState,
  MovementFilter,
  PetEntry,
  TroopRole,
} from '../data/types';
import { createEmptyLoadout, pruneLoadoutForTownHall } from '../engine/loadoutRules';
import type { Locale } from '../utils/i18n';

export const STORAGE_KEY = 'clash-roulette:v1';
const LEGACY_STORAGE_KEY = 'coc-attack-spin:v1';

export interface PersistedState {
  version: 1;
  locale: Locale;
  townHall: number;
  activeCategory: CategoryId;
  filters: FilterState;
  loadout: LoadoutState;
  fastSpin: boolean;
  soundEnabled: boolean;
  soundVolume: number;
}

const VALID_ROLES = new Set<string>(ALL_TROOP_ROLES);

export function createDefaultFilters(): FilterState {
  return {
    roles: [],
    matchMode: 'OR',
    movement: 'all',
    includeCcSiege: true,
    realisticLimits: true,
    antiDuplicate: true,
    equipRelevanceOverride: null,
    heroRelevanceOverride: null,
  };
}

export function createDefaultPersistedState(): PersistedState {
  return {
    version: 1,
    locale: 'id',
    townHall: MAX_TOWN_HALL,
    activeCategory: 'troops',
    filters: createDefaultFilters(),
    loadout: createEmptyLoadout(),
    fastSpin: false,
    soundEnabled: true,
    soundVolume: 0.5,
  };
}

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

let sanitizeUidSeq = 1;
function ensureUniqueUid(rawUid: unknown, prefix: string, seenUids: Set<string>): string {
  const candidate = typeof rawUid === 'string' ? rawUid.trim() : '';
  if (candidate.length > 0 && !seenUids.has(candidate)) {
    seenUids.add(candidate);
    return candidate;
  }
  let generated: string;
  do {
    sanitizeUidSeq += 1;
    generated = `${prefix}-s-${sanitizeUidSeq.toString(36)}`;
  } while (seenUids.has(generated));
  seenUids.add(generated);
  return generated;
}

function sanitizeArmyEntries(
  raw: unknown,
  expectedCategory: CategoryId,
  seenUids: Set<string>,
): ArmyEntry[] {
  if (!Array.isArray(raw)) return [];
  const result: ArmyEntry[] = [];
  for (const entry of raw) {
    if (!isObject(entry)) continue;
    if (typeof entry.itemId !== 'string') continue;
    const item = getItemById(entry.itemId);
    if (!item || item.category !== expectedCategory) continue;
    result.push({
      uid: ensureUniqueUid(entry.uid, expectedCategory, seenUids),
      itemId: entry.itemId,
      locked: Boolean(entry.locked),
    });
  }
  return result;
}

function sanitizeEquipmentEntries(raw: unknown, seenUids: Set<string>): EquipmentEntry[] {
  if (!Array.isArray(raw)) return [];
  const result: EquipmentEntry[] = [];
  for (const entry of raw) {
    if (!isObject(entry)) continue;
    if (typeof entry.itemId !== 'string') continue;
    const item = getItemById(entry.itemId);
    if (!item || item.category !== 'equipment') continue;
    const eqItem = item as EquipmentItem;
    result.push({
      uid: ensureUniqueUid(entry.uid, 'eq', seenUids),
      itemId: eqItem.id,
      heroId: eqItem.heroId,
      locked: Boolean(entry.locked),
    });
  }
  return result;
}

function sanitizePetEntry(raw: unknown, seenUids: Set<string>): PetEntry | null {
  if (!isObject(raw)) return null;
  if (typeof raw.itemId !== 'string') return null;
  const item = getItemById(raw.itemId);
  if (!item || item.category !== 'pets') return null;
  return {
    uid: ensureUniqueUid(raw.uid, 'pet', seenUids),
    itemId: raw.itemId,
    locked: Boolean(raw.locked),
  };
}

function sanitizeLoadout(raw: unknown): LoadoutState {
  if (!isObject(raw)) return createEmptyLoadout();

  const seenUids = new Set<string>();
  const seenHeroIds = new Set<HeroId>();
  const heroes: HeroSlot[] = [];
  if (Array.isArray(raw.heroes)) {
    for (const slot of raw.heroes) {
      if (!isObject(slot)) continue;
      if (typeof slot.heroId !== 'string') continue;
      const hero = getHeroById(slot.heroId as HeroId);
      if (!hero || seenHeroIds.has(hero.id)) continue;
      seenHeroIds.add(hero.id);
      heroes.push({
        uid: ensureUniqueUid(slot.uid, 'hero', seenUids),
        heroId: hero.id,
        locked: Boolean(slot.locked),
        equipment: sanitizeEquipmentEntries(slot.equipment, seenUids).filter(
          (e) => e.heroId === hero.id,
        ),
        pet: sanitizePetEntry(slot.pet, seenUids),
      });
    }
  }

  const unpairedPets: PetEntry[] = [];
  if (Array.isArray(raw.unpairedPets)) {
    for (const pet of raw.unpairedPets) {
      const sanitized = sanitizePetEntry(pet, seenUids);
      if (sanitized) unpairedPets.push(sanitized);
    }
  }

  return {
    heroes,
    unpairedEquipment: sanitizeEquipmentEntries(raw.unpairedEquipment, seenUids),
    unpairedPets,
    troops: sanitizeArmyEntries(raw.troops, 'troops', seenUids),
    superTroops: sanitizeArmyEntries(raw.superTroops, 'superTroops', seenUids),
    spells: sanitizeArmyEntries(raw.spells, 'spells', seenUids),
    siegeMachines: sanitizeArmyEntries(raw.siegeMachines, 'siegeMachines', seenUids),
  };
}

function sanitizeFilters(raw: unknown): FilterState {
  const defaults = createDefaultFilters();
  if (!isObject(raw)) return defaults;

  const roles: TroopRole[] = Array.isArray(raw.roles)
    ? Array.from(
        new Set(
          raw.roles.filter((r): r is TroopRole => typeof r === 'string' && VALID_ROLES.has(r)),
        ),
      )
    : [];

  const matchMode = raw.matchMode === 'AND' ? 'AND' : 'OR';
  const movement: MovementFilter =
    raw.movement === 'ground' || raw.movement === 'air' ? raw.movement : 'all';

  return {
    roles,
    matchMode,
    movement,
    includeCcSiege:
      typeof raw.includeCcSiege === 'boolean' ? raw.includeCcSiege : defaults.includeCcSiege,
    realisticLimits:
      typeof raw.realisticLimits === 'boolean' ? raw.realisticLimits : defaults.realisticLimits,
    antiDuplicate:
      typeof raw.antiDuplicate === 'boolean' ? raw.antiDuplicate : defaults.antiDuplicate,
    equipRelevanceOverride:
      typeof raw.equipRelevanceOverride === 'boolean' ? raw.equipRelevanceOverride : null,
    heroRelevanceOverride:
      typeof raw.heroRelevanceOverride === 'boolean' ? raw.heroRelevanceOverride : null,
  };
}

export function loadPersistedState(storage?: Pick<Storage, 'getItem'>): PersistedState {
  const fallback = createDefaultPersistedState();
  const targetStorage =
    storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!targetStorage) return fallback;

  try {
    const rawText = targetStorage.getItem(STORAGE_KEY) ?? targetStorage.getItem(LEGACY_STORAGE_KEY);
    if (!rawText) return fallback;
    const parsed: unknown = JSON.parse(rawText);
    if (!isObject(parsed) || parsed.version !== 1) return fallback;

    const rawTh =
      typeof parsed.townHall === 'number' && Number.isFinite(parsed.townHall)
        ? Math.floor(parsed.townHall)
        : MAX_TOWN_HALL;
    const townHall = Math.max(MIN_TOWN_HALL, Math.min(MAX_TOWN_HALL, rawTh));
    const filters = sanitizeFilters(parsed.filters);
    const available = getAvailableCategories(townHall, filters.includeCcSiege);
    const activeCategory: CategoryId =
      typeof parsed.activeCategory === 'string' &&
      available.includes(parsed.activeCategory as CategoryId)
        ? (parsed.activeCategory as CategoryId)
        : 'troops';

    const sanitizedLoadout = sanitizeLoadout(parsed.loadout);
    const { loadout } = pruneLoadoutForTownHall(
      sanitizedLoadout,
      townHall,
      filters.includeCcSiege,
      filters.realisticLimits,
    );

    const rawVol =
      typeof parsed.soundVolume === 'number' && Number.isFinite(parsed.soundVolume)
        ? parsed.soundVolume
        : 0.5;

    const locale: Locale = parsed.locale === 'en' ? 'en' : 'id';

    return {
      version: 1,
      locale,
      townHall,
      activeCategory,
      filters,
      loadout,
      fastSpin: Boolean(parsed.fastSpin),
      soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true,
      soundVolume: Math.max(0, Math.min(1, rawVol)),
    };
  } catch {
    return fallback;
  }
}

export function savePersistedState(
  state: PersistedState,
  storage?: Pick<Storage, 'setItem'>,
): void {
  const targetStorage =
    storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!targetStorage) return;
  try {
    targetStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota or private-mode errors
  }
}
