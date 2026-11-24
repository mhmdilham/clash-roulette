import {
  getItemById,
  getTownHallConfig,
  isItemUnlockedAtTh,
} from '../data';
import type {
  ArmyEntry,
  EquipmentEntry,
  EquipmentItem,
  HeroId,
  HeroSlot,
  LoadoutState,
  PetEntry,
  ReplaceTarget,
  SlotTarget,
  SpinItem,
} from '../data/types';

let uidSeq = 1;
function makeUid(prefix: string): string {
  uidSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${uidSeq.toString(36)}`;
}

export function createEmptyLoadout(): LoadoutState {
  return {
    heroes: [],
    unpairedEquipment: [],
    unpairedPets: [],
    troops: [],
    superTroops: [],
    spells: [],
    siegeMachines: [],
  };
}

function cloneLoadout(loadout: LoadoutState): LoadoutState {
  return {
    heroes: loadout.heroes.map((h) => ({
      ...h,
      equipment: h.equipment.map((e) => ({ ...e })),
      pet: h.pet ? { ...h.pet } : null,
    })),
    unpairedEquipment: loadout.unpairedEquipment.map((e) => ({ ...e })),
    unpairedPets: loadout.unpairedPets.map((p) => ({ ...p })),
    troops: loadout.troops.map((t) => ({ ...t })),
    superTroops: loadout.superTroops.map((t) => ({ ...t })),
    spells: loadout.spells.map((s) => ({ ...s })),
    siegeMachines: loadout.siegeMachines.map((s) => ({ ...s })),
  };
}

function pullUnpairedEquipmentForHero(
  unpairedEquipment: EquipmentEntry[],
  heroId: HeroId,
  maxToPull: number,
): { pulled: EquipmentEntry[]; remaining: EquipmentEntry[] } {
  const pulled: EquipmentEntry[] = [];
  const remaining: EquipmentEntry[] = [];
  for (const eq of unpairedEquipment) {
    if (eq.heroId === heroId && pulled.length < maxToPull) {
      pulled.push(eq);
    } else {
      remaining.push(eq);
    }
  }
  return { pulled, remaining };
}

function replaceArmyEntry(entries: ArmyEntry[], uid: string, newItemId: string): ArmyEntry[] {
  return entries.map((entry) =>
    entry.uid === uid ? { ...entry, itemId: newItemId, locked: false } : entry,
  );
}

export function applySpinResult(
  loadout: LoadoutState,
  item: SpinItem,
  options: { realisticLimits: boolean; replaceTarget?: ReplaceTarget | null },
): LoadoutState {
  const next = cloneLoadout(loadout);
  const { realisticLimits, replaceTarget } = options;

  // Handle in-place replacement when re-spinning an existing slot
  if (replaceTarget && replaceTarget.category === item.category) {
    const target = replaceTarget.target;

    if (target.kind === 'hero' && item.category === 'heroes') {
      const idx = next.heroes.findIndex((h) => h.uid === target.heroUid);
      if (idx !== -1) {
        const oldHero = next.heroes[idx];
        // Decision 2A: keep locked equipment as unpaired, delete unlocked equipment, keep Pet on slot
        const lockedEq = oldHero.equipment.filter((e) => e.locked);
        next.unpairedEquipment.push(...lockedEq);

        const maxEquip = realisticLimits ? 2 : Infinity;
        const { pulled, remaining } = pullUnpairedEquipmentForHero(
          next.unpairedEquipment,
          item.id,
          maxEquip,
        );
        next.unpairedEquipment = remaining;

        next.heroes[idx] = {
          uid: oldHero.uid,
          heroId: item.id,
          locked: false,
          equipment: pulled,
          pet: oldHero.pet,
        };
        return next;
      }
    }

    if (target.kind === 'pairedEquipment' && item.category === 'equipment') {
      const hero = next.heroes.find((h) => h.uid === target.heroUid);
      if (hero) {
        const eqIdx = hero.equipment.findIndex((e) => e.uid === target.equipUid);
        if (eqIdx !== -1) {
          if (item.heroId === hero.heroId) {
            hero.equipment[eqIdx] = {
              uid: hero.equipment[eqIdx].uid,
              itemId: item.id,
              heroId: item.heroId,
              locked: false,
            };
            return next;
          }
          // Equipment belongs to a different hero (relevance OFF): detach from current hero and insert normally
          hero.equipment.splice(eqIdx, 1);
        }
      }
    }

    if (target.kind === 'unpairedEquipment' && item.category === 'equipment') {
      const idx = next.unpairedEquipment.findIndex((e) => e.uid === target.equipUid);
      if (idx !== -1) {
        const targetHero = next.heroes.find(
          (h) => h.heroId === item.heroId && (!realisticLimits || h.equipment.length < 2),
        );
        if (targetHero) {
          next.unpairedEquipment.splice(idx, 1);
          targetHero.equipment.push({
            uid: makeUid('eq'),
            itemId: item.id,
            heroId: item.heroId,
            locked: false,
          });
        } else {
          next.unpairedEquipment[idx] = {
            uid: next.unpairedEquipment[idx].uid,
            itemId: item.id,
            heroId: item.heroId,
            locked: false,
          };
        }
        return next;
      }
    }

    if (target.kind === 'pairedPet' && item.category === 'pets') {
      const hero = next.heroes.find((h) => h.uid === target.heroUid);
      if (hero) {
        hero.pet = {
          uid: hero.pet?.uid ?? makeUid('pet'),
          itemId: item.id,
          locked: false,
        };
        return next;
      }
    }

    if (target.kind === 'unpairedPet' && item.category === 'pets') {
      const idx = next.unpairedPets.findIndex((p) => p.uid === target.petUid);
      if (idx !== -1) {
        next.unpairedPets[idx] = {
          uid: next.unpairedPets[idx].uid,
          itemId: item.id,
          locked: false,
        };
        return next;
      }
    }

    if (target.kind === 'troop' && item.category === 'troops') {
      next.troops = replaceArmyEntry(next.troops, target.uid, item.id);
      return next;
    }
    if (target.kind === 'superTroop' && item.category === 'superTroops') {
      next.superTroops = replaceArmyEntry(next.superTroops, target.uid, item.id);
      return next;
    }
    if (target.kind === 'spell' && item.category === 'spells') {
      next.spells = replaceArmyEntry(next.spells, target.uid, item.id);
      return next;
    }
    if (target.kind === 'siege' && item.category === 'siegeMachines') {
      next.siegeMachines = replaceArmyEntry(next.siegeMachines, target.uid, item.id);
      return next;
    }
  }

  // Standard additive spin
  switch (item.category) {
    case 'heroes': {
      const maxEquip = realisticLimits ? 2 : Infinity;
      const { pulled, remaining } = pullUnpairedEquipmentForHero(
        next.unpairedEquipment,
        item.id,
        maxEquip,
      );
      next.unpairedEquipment = remaining;
      const pairedPet = next.unpairedPets.length > 0 ? next.unpairedPets.shift()! : null;

      const slot: HeroSlot = {
        uid: makeUid('hero'),
        heroId: item.id,
        locked: false,
        equipment: pulled,
        pet: pairedPet,
      };
      next.heroes.push(slot);
      break;
    }
    case 'equipment': {
      const eqItem = item as EquipmentItem;
      const entry: EquipmentEntry = {
        uid: makeUid('eq'),
        itemId: eqItem.id,
        heroId: eqItem.heroId,
        locked: false,
      };
      const owner = next.heroes.find(
        (h) => h.heroId === eqItem.heroId && (!realisticLimits || h.equipment.length < 2),
      );
      if (owner) {
        owner.equipment.push(entry);
      } else {
        next.unpairedEquipment.push(entry);
      }
      break;
    }
    case 'pets': {
      const entry: PetEntry = {
        uid: makeUid('pet'),
        itemId: item.id,
        locked: false,
      };
      const openHero = next.heroes.find((h) => h.pet === null);
      if (openHero) {
        openHero.pet = entry;
      } else {
        next.unpairedPets.push(entry);
      }
      break;
    }
    case 'troops':
      next.troops.push({ uid: makeUid('troop'), itemId: item.id, locked: false });
      break;
    case 'superTroops':
      next.superTroops.push({ uid: makeUid('super'), itemId: item.id, locked: false });
      break;
    case 'spells':
      next.spells.push({ uid: makeUid('spell'), itemId: item.id, locked: false });
      break;
    case 'siegeMachines':
      next.siegeMachines.push({ uid: makeUid('siege'), itemId: item.id, locked: false });
      break;
  }

  return next;
}

export function removeLoadoutItem(loadout: LoadoutState, target: SlotTarget): LoadoutState {
  const next = cloneLoadout(loadout);

  switch (target.kind) {
    case 'hero': {
      const idx = next.heroes.findIndex((h) => h.uid === target.heroUid);
      if (idx !== -1) {
        const [removed] = next.heroes.splice(idx, 1);
        // Decision 2A: delete unlocked equipment, detach locked equipment to unpaired, move Pet to unpaired
        const lockedEquipment = removed.equipment.filter((e) => e.locked);
        next.unpairedEquipment.push(...lockedEquipment);
        if (removed.pet) {
          next.unpairedPets.push(removed.pet);
        }
      }
      break;
    }
    case 'pairedEquipment': {
      const hero = next.heroes.find((h) => h.uid === target.heroUid);
      if (hero) {
        hero.equipment = hero.equipment.filter((e) => e.uid !== target.equipUid);
      }
      break;
    }
    case 'unpairedEquipment':
      next.unpairedEquipment = next.unpairedEquipment.filter((e) => e.uid !== target.equipUid);
      break;
    case 'pairedPet': {
      const hero = next.heroes.find((h) => h.uid === target.heroUid);
      if (hero) {
        hero.pet = null;
      }
      break;
    }
    case 'unpairedPet':
      next.unpairedPets = next.unpairedPets.filter((p) => p.uid !== target.petUid);
      break;
    case 'troop':
      next.troops = next.troops.filter((t) => t.uid !== target.uid);
      break;
    case 'superTroop':
      next.superTroops = next.superTroops.filter((t) => t.uid !== target.uid);
      break;
    case 'spell':
      next.spells = next.spells.filter((s) => s.uid !== target.uid);
      break;
    case 'siege':
      next.siegeMachines = next.siegeMachines.filter((s) => s.uid !== target.uid);
      break;
  }

  return next;
}

export function toggleSlotLock(loadout: LoadoutState, target: SlotTarget): LoadoutState {
  const next = cloneLoadout(loadout);

  switch (target.kind) {
    case 'hero': {
      const hero = next.heroes.find((h) => h.uid === target.heroUid);
      if (hero) hero.locked = !hero.locked;
      break;
    }
    case 'pairedEquipment': {
      const hero = next.heroes.find((h) => h.uid === target.heroUid);
      const eq = hero?.equipment.find((e) => e.uid === target.equipUid);
      if (eq) eq.locked = !eq.locked;
      break;
    }
    case 'unpairedEquipment': {
      const eq = next.unpairedEquipment.find((e) => e.uid === target.equipUid);
      if (eq) eq.locked = !eq.locked;
      break;
    }
    case 'pairedPet': {
      const hero = next.heroes.find((h) => h.uid === target.heroUid);
      if (hero?.pet) hero.pet.locked = !hero.pet.locked;
      break;
    }
    case 'unpairedPet': {
      const pet = next.unpairedPets.find((p) => p.uid === target.petUid);
      if (pet) pet.locked = !pet.locked;
      break;
    }
    case 'troop': {
      const entry = next.troops.find((t) => t.uid === target.uid);
      if (entry) entry.locked = !entry.locked;
      break;
    }
    case 'superTroop': {
      const entry = next.superTroops.find((t) => t.uid === target.uid);
      if (entry) entry.locked = !entry.locked;
      break;
    }
    case 'spell': {
      const entry = next.spells.find((s) => s.uid === target.uid);
      if (entry) entry.locked = !entry.locked;
      break;
    }
    case 'siege': {
      const entry = next.siegeMachines.find((s) => s.uid === target.uid);
      if (entry) entry.locked = !entry.locked;
      break;
    }
  }

  return next;
}

export function clearUnlockedLoadout(loadout: LoadoutState): LoadoutState {
  const next = cloneLoadout(loadout);

  const keptHeroes: HeroSlot[] = [];
  const detachedLockedEq: EquipmentEntry[] = [];
  const detachedLockedPets: PetEntry[] = [];

  for (const hero of next.heroes) {
    if (hero.locked) {
      keptHeroes.push({
        ...hero,
        equipment: hero.equipment.filter((e) => e.locked),
        pet: hero.pet?.locked ? hero.pet : null,
      });
    } else {
      detachedLockedEq.push(...hero.equipment.filter((e) => e.locked));
      if (hero.pet?.locked) {
        detachedLockedPets.push(hero.pet);
      }
    }
  }

  next.heroes = keptHeroes;
  next.unpairedEquipment = [
    ...next.unpairedEquipment.filter((e) => e.locked),
    ...detachedLockedEq,
  ];
  next.unpairedPets = [...next.unpairedPets.filter((p) => p.locked), ...detachedLockedPets];
  next.troops = next.troops.filter((t) => t.locked);
  next.superTroops = next.superTroops.filter((t) => t.locked);
  next.spells = next.spells.filter((s) => s.locked);
  next.siegeMachines = next.siegeMachines.filter((s) => s.locked);

  return next;
}

export function slotTargetExists(loadout: LoadoutState, target: SlotTarget): boolean {
  switch (target.kind) {
    case 'hero':
      return loadout.heroes.some((h) => h.uid === target.heroUid);
    case 'pairedEquipment': {
      const hero = loadout.heroes.find((h) => h.uid === target.heroUid);
      return Boolean(hero?.equipment.some((e) => e.uid === target.equipUid));
    }
    case 'unpairedEquipment':
      return loadout.unpairedEquipment.some((e) => e.uid === target.equipUid);
    case 'pairedPet': {
      const hero = loadout.heroes.find((h) => h.uid === target.heroUid);
      return Boolean(hero?.pet);
    }
    case 'unpairedPet':
      return loadout.unpairedPets.some((p) => p.uid === target.petUid);
    case 'troop':
      return loadout.troops.some((t) => t.uid === target.uid);
    case 'superTroop':
      return loadout.superTroops.some((t) => t.uid === target.uid);
    case 'spell':
      return loadout.spells.some((s) => s.uid === target.uid);
    case 'siege':
      return loadout.siegeMachines.some((s) => s.uid === target.uid);
  }
}

export function pruneLoadoutForTownHall(
  loadout: LoadoutState,
  newTh: number,
  includeCcSiege: boolean,
  enforceCaps = true,
): { loadout: LoadoutState; removedNames: string[] } {
  const thConfig = getTownHallConfig(newTh);
  const removedNames: string[] = [];

  const maxHeroes = enforceCaps ? thConfig.maxActiveHeroes : Infinity;
  const maxPets = thConfig.maxPets === 0 ? 0 : enforceCaps ? thConfig.maxPets : Infinity;
  const maxSuper = thConfig.maxSuperTroops === 0 ? 0 : enforceCaps ? thConfig.maxSuperTroops : Infinity;
  const maxSiege = thConfig.maxSiege === 0 ? 0 : enforceCaps ? thConfig.maxSiege : Infinity;

  const isUnlocked = (itemId: string): boolean => {
    const item = getItemById(itemId);
    if (!item) return false;
    return isItemUnlockedAtTh(item, newTh, includeCcSiege);
  };

  const recordRemoved = (itemId: string) => {
    const item = getItemById(itemId);
    if (item) removedNames.push(item.name);
  };

  const next = createEmptyLoadout();

  // 1. Prune heroes by TH unlock & TH maxActiveHeroes cap
  for (const hero of loadout.heroes) {
    if (!isUnlocked(hero.heroId) || next.heroes.length >= maxHeroes) {
      recordRemoved(hero.heroId);
      for (const eq of hero.equipment) {
        recordRemoved(eq.itemId);
      }
      if (hero.pet) {
        if (isUnlocked(hero.pet.itemId) && maxPets > 0) {
          next.unpairedPets.push({ ...hero.pet });
        } else {
          recordRemoved(hero.pet.itemId);
        }
      }
      continue;
    }

    const keptEq: EquipmentEntry[] = [];
    for (const eq of hero.equipment) {
      if (isUnlocked(eq.itemId)) {
        keptEq.push({ ...eq });
      } else {
        recordRemoved(eq.itemId);
      }
    }

    let keptPet: PetEntry | null = null;
    if (hero.pet) {
      if (isUnlocked(hero.pet.itemId) && maxPets > 0) {
        keptPet = { ...hero.pet };
      } else {
        recordRemoved(hero.pet.itemId);
      }
    }

    next.heroes.push({
      ...hero,
      equipment: keptEq,
      pet: keptPet,
    });
  }

  // 2. Prune unpaired equipment
  for (const eq of loadout.unpairedEquipment) {
    if (isUnlocked(eq.itemId)) {
      next.unpairedEquipment.push({ ...eq });
    } else {
      recordRemoved(eq.itemId);
    }
  }

  // 3. Prune unpaired pets & enforce total maxPets cap
  const pairedPetCount = next.heroes.filter((h) => h.pet !== null).length;
  let totalPets = pairedPetCount;
  const candidateUnpairedPets = [...next.unpairedPets, ...loadout.unpairedPets.map((p) => ({ ...p }))];
  next.unpairedPets = [];

  for (const pet of candidateUnpairedPets) {
    if (isUnlocked(pet.itemId) && totalPets < maxPets) {
      const openHero = next.heroes.find((h) => h.pet === null);
      if (openHero) {
        openHero.pet = pet;
      } else {
        next.unpairedPets.push(pet);
      }
      totalPets += 1;
    } else {
      recordRemoved(pet.itemId);
    }
  }

  // 4. Prune troops, superTroops, spells, siegeMachines
  for (const t of loadout.troops) {
    if (isUnlocked(t.itemId)) next.troops.push({ ...t });
    else recordRemoved(t.itemId);
  }
  for (const st of loadout.superTroops) {
    if (isUnlocked(st.itemId) && next.superTroops.length < maxSuper) {
      next.superTroops.push({ ...st });
    } else {
      recordRemoved(st.itemId);
    }
  }
  for (const sp of loadout.spells) {
    if (isUnlocked(sp.itemId)) next.spells.push({ ...sp });
    else recordRemoved(sp.itemId);
  }
  for (const sg of loadout.siegeMachines) {
    if (isUnlocked(sg.itemId) && next.siegeMachines.length < maxSiege) {
      next.siegeMachines.push({ ...sg });
    } else {
      recordRemoved(sg.itemId);
    }
  }

  return { loadout: next, removedNames };
}
