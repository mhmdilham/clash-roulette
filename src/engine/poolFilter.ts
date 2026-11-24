import {
  getItemsByCategory,
  getTownHallConfig,
  isItemUnlockedAtTh,
} from '../data';
import type {
  CategoryId,
  EquipmentItem,
  FilterState,
  HeroId,
  LoadoutState,
  ReplaceTarget,
  SpinItem,
  SuperTroopItem,
  TroopItem,
} from '../data/types';

export type EmptyPoolReason =
  | 'slot-full'
  | 'no-role-match'
  | 'all-heroes-equipped'
  | 'no-relevant-heroes'
  | 'all-picked'
  | 'category-locked';

export interface PoolFilterInput {
  townHall: number;
  category: CategoryId;
  loadout: LoadoutState;
  filters: FilterState;
  replaceTarget?: ReplaceTarget | null;
}

export interface PoolFilterResult {
  items: SpinItem[];
  totalAtTh: number;
  emptyReason: EmptyPoolReason | null;
  relevanceAutoActive: boolean;
  relevanceEffective: boolean;
  slotUsage: { used: number; max: number | null };
}

function getAllPickedEquipmentIds(loadout: LoadoutState): Set<string> {
  const ids = new Set<string>();
  for (const hero of loadout.heroes) {
    for (const eq of hero.equipment) {
      ids.add(eq.itemId);
    }
  }
  for (const eq of loadout.unpairedEquipment) {
    ids.add(eq.itemId);
  }
  return ids;
}

function getAllPickedPetIds(loadout: LoadoutState): Set<string> {
  const ids = new Set<string>();
  for (const hero of loadout.heroes) {
    if (hero.pet) ids.add(hero.pet.itemId);
  }
  for (const pet of loadout.unpairedPets) {
    ids.add(pet.itemId);
  }
  return ids;
}

function getUnpairedEquipmentHeroIds(
  loadout: LoadoutState,
  ignoreUnpairedHeroId?: HeroId,
): Set<HeroId> {
  const heroIds = new Set<HeroId>();
  const chosenHeroIds = new Set(loadout.heroes.map((h) => h.heroId));
  for (const eq of loadout.unpairedEquipment) {
    if (ignoreUnpairedHeroId && eq.heroId === ignoreUnpairedHeroId) continue;
    if (!chosenHeroIds.has(eq.heroId)) {
      heroIds.add(eq.heroId);
    }
  }
  return heroIds;
}

export function getEffectiveRelevance(
  category: 'heroes' | 'equipment',
  loadout: LoadoutState,
  filters: FilterState,
  ignoreUnpairedHeroId?: HeroId,
): { autoActive: boolean; effective: boolean } {
  if (category === 'equipment') {
    const autoActive = loadout.heroes.length > 0;
    const effective =
      filters.equipRelevanceOverride !== null ? filters.equipRelevanceOverride : autoActive;
    return { autoActive, effective };
  }

  // Heroes tab: only auto-activate when there is >= 1 unpaired equipment whose owner is not yet picked
  const relevantUnpairedHeroes = getUnpairedEquipmentHeroIds(loadout, ignoreUnpairedHeroId);
  const autoActive = relevantUnpairedHeroes.size > 0;
  const effective =
    filters.heroRelevanceOverride !== null ? filters.heroRelevanceOverride : autoActive;
  return { autoActive, effective };
}

export function getSlotUsage(
  category: CategoryId,
  townHall: number,
  loadout: LoadoutState,
  realisticLimits: boolean,
): { used: number; max: number | null } {
  const thConfig = getTownHallConfig(townHall);
  switch (category) {
    case 'heroes':
      return {
        used: loadout.heroes.length,
        max: realisticLimits ? thConfig.maxActiveHeroes : null,
      };
    case 'pets': {
      const used =
        loadout.heroes.filter((h) => h.pet !== null).length + loadout.unpairedPets.length;
      return {
        used,
        max: realisticLimits ? thConfig.maxPets : null,
      };
    }
    case 'equipment': {
      const used =
        loadout.heroes.reduce((sum, h) => sum + h.equipment.length, 0) +
        loadout.unpairedEquipment.length;
      const max = realisticLimits
        ? loadout.heroes.length > 0
          ? loadout.heroes.length * 2
          : thConfig.maxActiveHeroes * 2
        : null;
      return { used, max };
    }
    case 'superTroops':
      return {
        used: loadout.superTroops.length,
        max: realisticLimits ? thConfig.maxSuperTroops : null,
      };
    case 'siegeMachines':
      return {
        used: loadout.siegeMachines.length,
        max: realisticLimits ? thConfig.maxSiege : null,
      };
    case 'troops':
      return { used: loadout.troops.length, max: null };
    case 'spells':
      return { used: loadout.spells.length, max: null };
  }
}

export function computeEligiblePool(input: PoolFilterInput): PoolFilterResult {
  const { townHall, category, loadout, filters, replaceTarget } = input;
  const isReplacing = Boolean(replaceTarget && replaceTarget.category === category);
  const slotUsage = getSlotUsage(category, townHall, loadout, filters.realisticLimits);

  const relevance =
    category === 'heroes' || category === 'equipment'
      ? getEffectiveRelevance(
          category,
          loadout,
          filters,
          isReplacing ? replaceTarget?.ignoreUnpairedHeroId : undefined,
        )
      : { autoActive: false, effective: false };

  // 1. Unlocked items at selected Town Hall
  const unlockedAtTh = getItemsByCategory(category).filter((item) =>
    isItemUnlockedAtTh(item, townHall, filters.includeCcSiege),
  );
  const totalAtTh = unlockedAtTh.length;

  if (totalAtTh === 0) {
    return {
      items: [],
      totalAtTh: 0,
      emptyReason: 'category-locked',
      relevanceAutoActive: relevance.autoActive,
      relevanceEffective: relevance.effective,
      slotUsage,
    };
  }

  // 2. Hard slot-cap check when realistic limits are ON (not applicable when replacing an existing slot)
  if (
    filters.realisticLimits &&
    !isReplacing &&
    category !== 'equipment' &&
    slotUsage.max !== null &&
    slotUsage.used >= slotUsage.max
  ) {
    return {
      items: [],
      totalAtTh,
      emptyReason: 'slot-full',
      relevanceAutoActive: relevance.autoActive,
      relevanceEffective: relevance.effective,
      slotUsage,
    };
  }

  let pool: SpinItem[] = [...unlockedAtTh];

  // 3. Troops & Super Troops multi-role + movement filtering
  if (category === 'troops' || category === 'superTroops') {
    pool = (pool as (TroopItem | SuperTroopItem)[]).filter((unit) => {
      if (filters.movement !== 'all' && unit.movement !== filters.movement) {
        return false;
      }
      if (filters.roles.length === 0) {
        return true;
      }
      if (filters.matchMode === 'AND') {
        return filters.roles.every((role) => unit.roles.includes(role));
      }
      return filters.roles.some((role) => unit.roles.includes(role));
    });

    if (pool.length === 0) {
      return {
        items: [],
        totalAtTh,
        emptyReason: 'no-role-match',
        relevanceAutoActive: false,
        relevanceEffective: false,
        slotUsage,
      };
    }
  }

  // 4. Bidirectional Hero <-> Equipment relevance filtering
  if (category === 'equipment' && relevance.effective) {
    if (isReplacing && replaceTarget?.scopedHeroId) {
      const targetHeroId = replaceTarget.scopedHeroId;
      pool = (pool as EquipmentItem[]).filter((eq) => eq.heroId === targetHeroId);
    } else if (loadout.heroes.length > 0) {
      const openHeroIds = new Set<HeroId>(
        loadout.heroes
          .filter((h) => !filters.realisticLimits || h.equipment.length < 2)
          .map((h) => h.heroId),
      );

      if (openHeroIds.size === 0) {
        return {
          items: [],
          totalAtTh,
          emptyReason: 'all-heroes-equipped',
          relevanceAutoActive: relevance.autoActive,
          relevanceEffective: relevance.effective,
          slotUsage,
        };
      }

      pool = (pool as EquipmentItem[]).filter((eq) => openHeroIds.has(eq.heroId));
    }
  }

  if (category === 'heroes' && relevance.effective) {
    const neededHeroIds = getUnpairedEquipmentHeroIds(
      loadout,
      isReplacing ? replaceTarget?.ignoreUnpairedHeroId : undefined,
    );
    if (neededHeroIds.size > 0) {
      pool = pool.filter((hero) => neededHeroIds.has(hero.id as HeroId));
      if (pool.length === 0) {
        return {
          items: [],
          totalAtTh,
          emptyReason: 'no-relevant-heroes',
          relevanceAutoActive: relevance.autoActive,
          relevanceEffective: relevance.effective,
          slotUsage,
        };
      }
    }
  }

  // 5. Exclude already-picked items (always unique for heroes/equipment/pets/superTroops/siege; optional for troops/spells)
  const excludeIds = new Set<string>();
  const currentReplacedId = isReplacing ? replaceTarget?.currentItemId : undefined;

  if (category === 'heroes') {
    for (const hero of loadout.heroes) {
      if (isReplacing && replaceTarget?.target.kind === 'hero' && hero.uid === replaceTarget.target.heroUid) {
        continue;
      }
      excludeIds.add(hero.heroId);
    }
  } else if (category === 'equipment') {
    for (const id of getAllPickedEquipmentIds(loadout)) {
      if (id !== currentReplacedId) {
        excludeIds.add(id);
      }
    }
  } else if (category === 'pets') {
    for (const id of getAllPickedPetIds(loadout)) {
      if (id !== currentReplacedId) {
        excludeIds.add(id);
      }
    }
  } else if (category === 'superTroops') {
    for (const entry of loadout.superTroops) {
      if (isReplacing && replaceTarget?.target.kind === 'superTroop' && entry.uid === replaceTarget.target.uid) {
        continue;
      }
      excludeIds.add(entry.itemId);
    }
  } else if (category === 'siegeMachines') {
    for (const entry of loadout.siegeMachines) {
      if (isReplacing && replaceTarget?.target.kind === 'siege' && entry.uid === replaceTarget.target.uid) {
        continue;
      }
      excludeIds.add(entry.itemId);
    }
  } else if (category === 'troops' && filters.antiDuplicate) {
    for (const entry of loadout.troops) {
      if (isReplacing && replaceTarget?.target.kind === 'troop' && entry.uid === replaceTarget.target.uid) {
        continue;
      }
      excludeIds.add(entry.itemId);
    }
  } else if (category === 'spells' && filters.antiDuplicate) {
    for (const entry of loadout.spells) {
      if (isReplacing && replaceTarget?.target.kind === 'spell' && entry.uid === replaceTarget.target.uid) {
        continue;
      }
      excludeIds.add(entry.itemId);
    }
  }

  pool = pool.filter((item) => !excludeIds.has(item.id));

  // When re-spinning a slot, exclude the replaced item itself if at least 1 alternative exists
  if (isReplacing && currentReplacedId) {
    const withoutCurrent = pool.filter((item) => item.id !== currentReplacedId);
    if (withoutCurrent.length > 0) {
      pool = withoutCurrent;
    }
  }

  return {
    items: pool,
    totalAtTh,
    emptyReason: pool.length === 0 ? 'all-picked' : null,
    relevanceAutoActive: relevance.autoActive,
    relevanceEffective: relevance.effective,
    slotUsage,
  };
}
