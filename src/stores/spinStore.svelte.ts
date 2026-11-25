import { getAvailableCategories, getHeroById, getItemById } from '../data';
import type {
  CategoryId,
  FilterState,
  LoadoutState,
  MatchMode,
  MovementFilter,
  ReplaceTarget,
  SlotTarget,
  SpinItem,
  TroopRole,
} from '../data/types';
import {
  applySpinResult,
  clearUnlockedLoadout,
  createEmptyLoadout,
  pruneLoadoutForTownHall,
  removeLoadoutItem,
  slotTargetExists,
  toggleSlotLock,
} from '../engine/loadoutRules';
import { computeEligiblePool, type PoolFilterResult } from '../engine/poolFilter';
import { spinAudio } from '../utils/audio';
import { TRANSLATIONS, type Locale, type Translations } from '../utils/i18n';
import { createDefaultFilters, loadPersistedState, savePersistedState } from './persistence';

interface RevealRecord {
  item: SpinItem;
  replacedItemName?: string;
  slotTarget?: SlotTarget;
}

class SpinStore {
  locale = $state<Locale>('id');
  townHall = $state<number>(19);
  activeCategory = $state<CategoryId>('troops');
  filters = $state<FilterState>(createDefaultFilters());
  loadout = $state<LoadoutState>(createEmptyLoadout());
  fastSpin = $state<boolean>(false);
  soundEnabled = $state<boolean>(true);
  soundVolume = $state<number>(0.5);

  t = $derived<Translations>(TRANSLATIONS[this.locale]);

  isSpinning = $state<boolean>(false);
  replaceTarget = $state<ReplaceTarget | null>(null);
  respinRequestSeq = $state<number>(0);
  lastReveal = $state<RevealRecord | null>(null);
  toastMessage = $state<string | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  availableCategories = $derived<CategoryId[]>(
    getAvailableCategories(this.townHall, this.filters.includeCcSiege),
  );

  poolResult = $derived<PoolFilterResult>(
    computeEligiblePool({
      townHall: this.townHall,
      category: this.activeCategory,
      loadout: this.loadout,
      filters: this.filters,
      replaceTarget: this.replaceTarget,
    }),
  );

  totalPickedCount = $derived<number>(
    this.loadout.heroes.length +
      this.loadout.heroes.reduce((s, h) => s + h.equipment.length + (h.pet ? 1 : 0), 0) +
      this.loadout.unpairedEquipment.length +
      this.loadout.unpairedPets.length +
      this.loadout.troops.length +
      this.loadout.superTroops.length +
      this.loadout.spells.length +
      this.loadout.siegeMachines.length,
  );

  constructor() {
    const initial = loadPersistedState();
    this.locale = initial.locale;
    this.townHall = initial.townHall;
    this.activeCategory = initial.activeCategory;
    this.filters = initial.filters;
    this.loadout = initial.loadout;
    this.fastSpin = initial.fastSpin;
    this.soundEnabled = initial.soundEnabled;
    this.soundVolume = initial.soundVolume;
    spinAudio.setEnabled(this.soundEnabled);
    spinAudio.setVolume(this.soundVolume);
    this.syncDocumentLang();
  }

  private syncDocumentLang(): void {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = this.locale;
    }
  }

  setLocale(nextLocale: Locale): void {
    if (this.locale === nextLocale) return;
    this.locale = nextLocale;
    this.syncDocumentLang();
    this.persist();
  }

  private persist(): void {
    savePersistedState({
      version: 1,
      locale: this.locale,
      townHall: this.townHall,
      activeCategory: this.activeCategory,
      filters: this.filters,
      loadout: this.loadout,
      fastSpin: this.fastSpin,
      soundEnabled: this.soundEnabled,
      soundVolume: this.soundVolume,
    });
  }

  showToast(message: string, durationMs = 4000): void {
    this.toastMessage = message;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = null;
      this.toastTimer = null;
    }, durationMs);
  }

  dismissToast(): void {
    this.toastMessage = null;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }

  setTownHall(nextTh: number): void {
    if (this.isSpinning) return;
    const clamped = Math.max(1, Math.min(19, Math.floor(nextTh)));
    if (clamped === this.townHall) return;

    const prevTh = this.townHall;
    this.townHall = clamped;
    this.replaceTarget = null;

    if (clamped < prevTh) {
      const { loadout, removedNames } = pruneLoadoutForTownHall(
        this.loadout,
        clamped,
        this.filters.includeCcSiege,
        this.filters.realisticLimits,
      );
      this.loadout = loadout;
      if (
        this.lastReveal?.slotTarget &&
        !slotTargetExists(this.loadout, this.lastReveal.slotTarget)
      ) {
        this.lastReveal = null;
      }
      if (removedNames.length > 0) {
        const preview =
          removedNames.length <= 4
            ? removedNames.join(', ')
            : `${removedNames.slice(0, 4).join(', ')} ${this.t.toastMoreItems(removedNames.length - 4)}`;
        this.showToast(this.t.toastThLowered(clamped, preview), 5000);
      }
    }

    const available = getAvailableCategories(this.townHall, this.filters.includeCcSiege);
    if (!available.includes(this.activeCategory)) {
      this.activeCategory = 'troops';
    }
    this.persist();
  }

  setCategory(category: CategoryId): void {
    if (this.isSpinning) return;
    if (!this.availableCategories.includes(category)) return;
    this.activeCategory = category;
    this.replaceTarget = null;
    this.persist();
  }

  toggleRole(role: TroopRole): void {
    if (this.isSpinning) return;
    const exists = this.filters.roles.includes(role);
    this.filters = {
      ...this.filters,
      roles: exists ? this.filters.roles.filter((r) => r !== role) : [...this.filters.roles, role],
    };
    this.persist();
  }

  setMatchMode(mode: MatchMode): void {
    if (this.isSpinning) return;
    this.filters = { ...this.filters, matchMode: mode };
    this.persist();
  }

  setMovement(movement: MovementFilter): void {
    if (this.isSpinning) return;
    this.filters = { ...this.filters, movement };
    this.persist();
  }

  resetTroopFilters(): void {
    if (this.isSpinning) return;
    this.filters = {
      ...this.filters,
      roles: [],
      matchMode: 'OR',
      movement: 'all',
    };
    this.persist();
  }

  toggleIncludeCcSiege(): void {
    if (this.isSpinning) return;
    const nextInclude = !this.filters.includeCcSiege;
    this.filters = { ...this.filters, includeCcSiege: nextInclude };

    const { loadout, removedNames } = pruneLoadoutForTownHall(
      this.loadout,
      this.townHall,
      nextInclude,
      this.filters.realisticLimits,
    );
    this.loadout = loadout;
    if (
      this.lastReveal?.slotTarget &&
      !slotTargetExists(this.loadout, this.lastReveal.slotTarget)
    ) {
      this.lastReveal = null;
    }
    if (removedNames.length > 0) {
      this.showToast(this.t.toastWorkshopOnly(removedNames.join(', ')));
    }

    const available = getAvailableCategories(this.townHall, nextInclude);
    if (!available.includes(this.activeCategory)) {
      this.activeCategory = 'troops';
    }
    this.persist();
  }

  toggleRealisticLimits(): void {
    if (this.isSpinning) return;
    this.filters = { ...this.filters, realisticLimits: !this.filters.realisticLimits };
    this.persist();
  }

  toggleAntiDuplicate(): void {
    if (this.isSpinning) return;
    this.filters = { ...this.filters, antiDuplicate: !this.filters.antiDuplicate };
    this.persist();
  }

  toggleRelevance(direction: 'heroes' | 'equipment', forceValue?: boolean): void {
    if (this.isSpinning) return;
    const currentEffective = this.poolResult.relevanceEffective;
    const nextVal = forceValue !== undefined ? forceValue : !currentEffective;
    if (direction === 'equipment') {
      this.filters = { ...this.filters, equipRelevanceOverride: nextVal };
    } else {
      this.filters = { ...this.filters, heroRelevanceOverride: nextVal };
    }
    this.persist();
  }

  setFastSpin(enabled: boolean): void {
    this.fastSpin = enabled;
    this.persist();
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    spinAudio.setEnabled(enabled);
    this.persist();
  }

  setSoundVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.soundVolume = clamped;
    spinAudio.setVolume(clamped);
    this.persist();
  }

  beginSpin(): boolean {
    if (this.isSpinning) return false;
    if (this.poolResult.items.length === 0) return false;
    this.isSpinning = true;
    return true;
  }

  completeSpin(item: SpinItem): void {
    const activeReplace = this.replaceTarget;
    this.loadout = applySpinResult(this.loadout, item, {
      realisticLimits: this.filters.realisticLimits,
      replaceTarget: activeReplace,
    });
    this.isSpinning = false;
    this.replaceTarget = null;
    this.lastReveal = {
      item,
      replacedItemName: activeReplace?.currentItemName,
      slotTarget: this.findLatestSlotTarget(item, activeReplace?.target),
    };
    spinAudio.playReveal();
    this.persist();
  }

  private findLatestSlotTarget(item: SpinItem, replaced?: SlotTarget): SlotTarget | undefined {
    if (replaced && slotTargetExists(this.loadout, replaced)) return replaced;
    switch (item.category) {
      case 'heroes': {
        const slot = this.loadout.heroes.find((h) => h.heroId === item.id);
        return slot ? { kind: 'hero', heroUid: slot.uid } : undefined;
      }
      case 'equipment': {
        for (const h of this.loadout.heroes) {
          const eq = h.equipment.find((e) => e.itemId === item.id);
          if (eq) return { kind: 'pairedEquipment', heroUid: h.uid, equipUid: eq.uid };
        }
        const uq = this.loadout.unpairedEquipment.find((e) => e.itemId === item.id);
        return uq ? { kind: 'unpairedEquipment', equipUid: uq.uid } : undefined;
      }
      case 'pets': {
        for (const h of this.loadout.heroes) {
          if (h.pet?.itemId === item.id) return { kind: 'pairedPet', heroUid: h.uid };
        }
        const up = this.loadout.unpairedPets.find((p) => p.itemId === item.id);
        return up ? { kind: 'unpairedPet', petUid: up.uid } : undefined;
      }
      case 'troops': {
        const last = this.loadout.troops[this.loadout.troops.length - 1];
        return last ? { kind: 'troop', uid: last.uid } : undefined;
      }
      case 'superTroops': {
        const last = this.loadout.superTroops[this.loadout.superTroops.length - 1];
        return last ? { kind: 'superTroop', uid: last.uid } : undefined;
      }
      case 'spells': {
        const last = this.loadout.spells[this.loadout.spells.length - 1];
        return last ? { kind: 'spell', uid: last.uid } : undefined;
      }
      case 'siegeMachines': {
        const last = this.loadout.siegeMachines[this.loadout.siegeMachines.length - 1];
        return last ? { kind: 'siege', uid: last.uid } : undefined;
      }
    }
  }

  startSlotRespin(target: SlotTarget): void {
    if (this.isSpinning) return;
    const resolved = this.resolveReplaceTarget(target);
    if (!resolved) return;

    this.activeCategory = resolved.category;
    this.replaceTarget = resolved;

    // Verify there is at least 1 candidate before triggering wheel animation
    if (this.poolResult.items.length === 0) {
      this.replaceTarget = null;
      this.showToast(this.t.toastNoRespinCandidate);
      return;
    }

    this.respinRequestSeq += 1;
  }

  cancelReplaceTarget(): void {
    if (this.isSpinning) return;
    this.replaceTarget = null;
  }

  private resolveReplaceTarget(target: SlotTarget): ReplaceTarget | null {
    switch (target.kind) {
      case 'hero': {
        const slot = this.loadout.heroes.find((h) => h.uid === target.heroUid);
        if (!slot) return null;
        const hero = getHeroById(slot.heroId);
        return {
          category: 'heroes',
          target,
          currentItemId: slot.heroId,
          currentItemName: hero?.name ?? slot.heroId,
          ignoreUnpairedHeroId: slot.heroId,
        };
      }
      case 'pairedEquipment': {
        const slot = this.loadout.heroes.find((h) => h.uid === target.heroUid);
        const eq = slot?.equipment.find((e) => e.uid === target.equipUid);
        if (!slot || !eq) return null;
        return {
          category: 'equipment',
          target,
          currentItemId: eq.itemId,
          currentItemName: getItemById(eq.itemId)?.name ?? eq.itemId,
          scopedHeroId: slot.heroId,
        };
      }
      case 'unpairedEquipment': {
        const eq = this.loadout.unpairedEquipment.find((e) => e.uid === target.equipUid);
        if (!eq) return null;
        return {
          category: 'equipment',
          target,
          currentItemId: eq.itemId,
          currentItemName: getItemById(eq.itemId)?.name ?? eq.itemId,
        };
      }
      case 'pairedPet': {
        const slot = this.loadout.heroes.find((h) => h.uid === target.heroUid);
        if (!slot?.pet) return null;
        return {
          category: 'pets',
          target,
          currentItemId: slot.pet.itemId,
          currentItemName: getItemById(slot.pet.itemId)?.name ?? slot.pet.itemId,
        };
      }
      case 'unpairedPet': {
        const pet = this.loadout.unpairedPets.find((p) => p.uid === target.petUid);
        if (!pet) return null;
        return {
          category: 'pets',
          target,
          currentItemId: pet.itemId,
          currentItemName: getItemById(pet.itemId)?.name ?? pet.itemId,
        };
      }
      case 'troop': {
        const entry = this.loadout.troops.find((t) => t.uid === target.uid);
        if (!entry) return null;
        return {
          category: 'troops',
          target,
          currentItemId: entry.itemId,
          currentItemName: getItemById(entry.itemId)?.name ?? entry.itemId,
        };
      }
      case 'superTroop': {
        const entry = this.loadout.superTroops.find((t) => t.uid === target.uid);
        if (!entry) return null;
        return {
          category: 'superTroops',
          target,
          currentItemId: entry.itemId,
          currentItemName: getItemById(entry.itemId)?.name ?? entry.itemId,
        };
      }
      case 'spell': {
        const entry = this.loadout.spells.find((s) => s.uid === target.uid);
        if (!entry) return null;
        return {
          category: 'spells',
          target,
          currentItemId: entry.itemId,
          currentItemName: getItemById(entry.itemId)?.name ?? entry.itemId,
        };
      }
      case 'siege': {
        const entry = this.loadout.siegeMachines.find((s) => s.uid === target.uid);
        if (!entry) return null;
        return {
          category: 'siegeMachines',
          target,
          currentItemId: entry.itemId,
          currentItemName: getItemById(entry.itemId)?.name ?? entry.itemId,
        };
      }
    }
  }

  removeSlot(target: SlotTarget): void {
    if (this.isSpinning) return;
    this.loadout = removeLoadoutItem(this.loadout, target);
    this.replaceTarget = null;
    if (
      this.lastReveal?.slotTarget &&
      !slotTargetExists(this.loadout, this.lastReveal.slotTarget)
    ) {
      this.lastReveal = null;
    }
    this.persist();
  }

  toggleLock(target: SlotTarget): void {
    if (this.isSpinning) return;
    this.loadout = toggleSlotLock(this.loadout, target);
    this.persist();
  }

  clearUnlocked(): void {
    if (this.isSpinning) return;
    this.loadout = clearUnlockedLoadout(this.loadout);
    this.replaceTarget = null;
    this.lastReveal = null;
    this.persist();
  }

  clearAll(): void {
    if (this.isSpinning) return;
    this.loadout = createEmptyLoadout();
    this.filters = {
      ...this.filters,
      equipRelevanceOverride: null,
      heroRelevanceOverride: null,
    };
    this.replaceTarget = null;
    this.lastReveal = null;
    this.persist();
  }

  resetCategory(): void {
    if (this.isSpinning) return;
    this.activeCategory = 'troops';
    this.filters = {
      ...createDefaultFilters(),
      includeCcSiege: this.filters.includeCcSiege,
      realisticLimits: this.filters.realisticLimits,
      antiDuplicate: this.filters.antiDuplicate,
    };
    this.replaceTarget = null;
    this.persist();
  }
}

export const spinStore = new SpinStore();
