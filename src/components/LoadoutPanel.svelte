<script lang="ts">
  import { Check, Copy, Download, Eraser, Lock, RotateCw, Trash2, Unlock, X } from '@lucide/svelte';
  import { getHeroById, getItemById, getTownHallConfig } from '../data';
  import type { SlotTarget, SuperTroopItem, TroopItem, TroopRole } from '../data/types';
  import { formatLoadoutText } from '../engine/exportFormatter';
  import { getPrimaryDisplayRole } from '../engine/poolFilter';
  import { spinStore } from '../stores/spinStore.svelte';
  import { exportElementToPng } from '../utils/exportImage';
  import UnitIcon from './UnitIcon.svelte';
  import ExportCard from './ExportCard.svelte';

  let copied = $state(false);
  let exporting = $state(false);
  let exportCardRef: HTMLDivElement | undefined = $state();

  let thConfig = $derived(getTownHallConfig(spinStore.townHall));
  let isEmpty = $derived(spinStore.totalPickedCount === 0);

  async function handleCopyText(): Promise<void> {
    if (isEmpty) return;
    const text = formatLoadoutText(spinStore.loadout, spinStore.townHall, spinStore.locale);
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      spinStore.showToast(spinStore.t.toastCopied);
      setTimeout(() => {
        copied = false;
      }, 2000);
    } catch {
      spinStore.showToast(spinStore.t.toastCopyFailed);
    }
  }

  async function handleDownloadPng(): Promise<void> {
    if (isEmpty || !exportCardRef || exporting) return;
    exporting = true;
    try {
      await exportElementToPng(exportCardRef, `clash-roulette-th${spinStore.townHall}.png`);
      spinStore.showToast(spinStore.t.toastPngSuccess);
    } catch {
      spinStore.showToast(spinStore.t.toastPngFailed);
    } finally {
      exporting = false;
    }
  }

  function lockClasses(locked: boolean): string {
    return locked
      ? 'bg-[var(--accent-tint)] text-[var(--accent)] hover:bg-[rgba(229,169,40,0.22)]'
      : 'text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]';
  }

  function roleBadgeClasses(role: TroopRole): string {
    switch (role) {
      case 'Main':
        return 'border-[var(--accent-border)] bg-[var(--accent-tint)] text-[var(--accent)]';
      case 'Tank':
        return 'border-[var(--positive-border)] bg-[var(--positive-tint)] text-[var(--positive)]';
      case 'Support':
        return 'border-sky-400/35 bg-sky-400/10 text-sky-300';
      case 'Damage Dealer':
        return 'border-[var(--danger-border)] bg-[var(--danger-tint)] text-[#f29b9b]';
      case 'Funnel':
        return 'border-orange-400/35 bg-orange-400/10 text-orange-300';
      case 'Clean-up':
        return 'border-[var(--border-strong)] bg-[var(--surface-raised)] text-[var(--ink-secondary)]';
    }
  }

  function triggerRespin(target: SlotTarget): void {
    spinStore.startSlotRespin(target);
  }
</script>

<section class="panel-surface p-4 sm:p-5">
  <!-- Header & Action Bar -->
  <div
    class="mb-5 flex flex-col justify-between gap-3 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-center"
  >
    <div class="flex flex-wrap items-center gap-2.5">
      <h2 class="text-base font-bold text-[var(--ink)]">Loadout</h2>
      <span
        class="rounded-md border border-[var(--accent-border)] bg-[var(--accent-tint)] px-2 py-0.5 font-mono text-xs font-semibold text-[var(--accent)] tabular-nums"
      >
        TH {spinStore.townHall}
      </span>
      <span class="font-mono text-xs text-[var(--muted)] tabular-nums">
        {spinStore.t.pickedCount(spinStore.totalPickedCount)}
      </span>
    </div>

    <div class="grid w-full shrink-0 grid-cols-2 gap-2 sm:w-auto sm:grid-cols-4">
      <button
        type="button"
        disabled={isEmpty || exporting}
        onclick={handleDownloadPng}
        class="btn-tactile inline-flex min-h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-ink)] hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Download class="h-3.5 w-3.5 shrink-0" />
        <span>{exporting ? spinStore.t.generatingPng : 'Export PNG'}</span>
      </button>

      <button
        type="button"
        disabled={isEmpty}
        onclick={handleCopyText}
        class="btn-tactile inline-flex min-h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-raised)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] hover:border-[var(--accent-border)] hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {#if copied}
          <Check class="h-3.5 w-3.5 shrink-0 text-[var(--positive)]" />
          <span>{spinStore.t.copied}</span>
        {:else}
          <Copy class="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
          <span>{spinStore.t.copyText}</span>
        {/if}
      </button>

      <button
        type="button"
        disabled={isEmpty || spinStore.isSpinning}
        onclick={() => spinStore.clearUnlocked()}
        class="btn-tactile inline-flex min-h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-inset)] px-3 py-1.5 text-xs font-medium text-[var(--ink-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-40"
        title={spinStore.t.clearUnlockedTitle}
      >
        <Eraser class="h-3.5 w-3.5 shrink-0" />
        <span>Clear Unlocked</span>
      </button>

      <button
        type="button"
        disabled={isEmpty || spinStore.isSpinning}
        onclick={() => spinStore.clearAll()}
        class="btn-tactile inline-flex min-h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[var(--danger-border)] bg-[var(--danger-tint)] px-3 py-1.5 text-xs font-medium text-[#f5b4b4] hover:bg-[rgba(226,93,93,0.2)] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Trash2 class="h-3.5 w-3.5 shrink-0" />
        <span>Clear All</span>
      </button>
    </div>
  </div>

  {#if isEmpty}
    <div
      class="rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--surface-inset)] px-4 py-9 text-center"
    >
      <p class="text-sm font-semibold text-[var(--ink)]">{spinStore.t.emptyLoadoutTitle}</p>
      <p class="mt-1 text-xs text-[var(--muted)]">
        {spinStore.t.emptyLoadoutBeforeSpin}
        <strong class="font-semibold text-[var(--accent)]">SPIN</strong>
        {spinStore.t.emptyLoadoutAfterSpin}
      </p>
    </div>
  {:else}
    <div class="space-y-6">
      <!-- 1. Heroes, Equipment & Pets -->
      {#if spinStore.loadout.heroes.length > 0 || spinStore.loadout.unpairedEquipment.length > 0 || spinStore.loadout.unpairedPets.length > 0}
        <div>
          <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 class="text-xs font-semibold text-[var(--ink)]">Heroes & Companions</h3>
            <span class="font-mono text-xs text-[var(--muted)] tabular-nums">
              Heroes {spinStore.loadout.heroes.length}/{spinStore.filters.realisticLimits
                ? thConfig.maxActiveHeroes
                : '∞'}
              {#if thConfig.maxPets > 0}
                • Pets {spinStore.loadout.heroes.filter((h) => h.pet).length +
                  spinStore.loadout.unpairedPets.length}/{spinStore.filters.realisticLimits
                  ? thConfig.maxPets
                  : '∞'}
              {/if}
            </span>
          </div>

          {#if spinStore.loadout.heroes.length > 0}
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
              {#each spinStore.loadout.heroes as slot (slot.uid)}
                {@const hero = getHeroById(slot.heroId)}
                {#if hero}
                  <div
                    class="flex flex-col justify-between rounded-lg border p-3.5 transition-colors {slot.locked
                      ? 'border-l-2 border-[var(--accent-border)] border-l-[var(--accent)] bg-[var(--accent-tint)]'
                      : 'border-[var(--border)] bg-[var(--surface-inset)]'}"
                  >
                    <!-- Hero Header Row -->
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex min-w-0 items-center gap-2.5">
                        <UnitIcon item={hero} size={42} class="border-[var(--accent-border)]" />
                        <div class="min-w-0">
                          <div class="truncate text-sm font-bold text-[var(--ink)]">
                            {hero.name}
                          </div>
                          <div class="font-mono text-[11px] text-[var(--muted)] tabular-nums">
                            Equip {slot.equipment.length}/2 {thConfig.maxPets > 0
                              ? `• ${slot.pet ? '1/1 Pet' : '0/1 Pet'}`
                              : ''}
                          </div>
                        </div>
                      </div>

                      <div class="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          disabled={spinStore.isSpinning}
                          onclick={() => triggerRespin({ kind: 'hero', heroUid: slot.uid })}
                          class="icon-action cursor-pointer text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--accent)] disabled:opacity-40"
                          title={spinStore.t.respinHeroTitle}
                          aria-label="Re-spin {hero.name}"
                        >
                          <RotateCw class="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={spinStore.isSpinning}
                          onclick={() => spinStore.toggleLock({ kind: 'hero', heroUid: slot.uid })}
                          class="icon-action cursor-pointer disabled:opacity-40 {lockClasses(
                            slot.locked,
                          )}"
                          title={slot.locked
                            ? spinStore.t.unlockHeroTitle
                            : spinStore.t.lockHeroTitle}
                          aria-label="{spinStore.t.lockTitle} {hero.name}"
                        >
                          {#if slot.locked}
                            <Lock class="h-3.5 w-3.5" />
                          {:else}
                            <Unlock class="h-3.5 w-3.5" />
                          {/if}
                        </button>
                        <button
                          type="button"
                          disabled={spinStore.isSpinning}
                          onclick={() => spinStore.removeSlot({ kind: 'hero', heroUid: slot.uid })}
                          class="icon-action cursor-pointer text-[var(--muted)] hover:bg-[var(--danger-tint)] hover:text-[var(--danger)] disabled:opacity-40"
                          title={spinStore.t.removeHeroTitle}
                          aria-label="{spinStore.t.removeTitle} {hero.name}"
                        >
                          <X class="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <!-- Aligned Sub-grid: 2-col Equipment + full-width Pet -->
                    <div class="mt-3 space-y-2 border-t border-[var(--border)] pt-2.5">
                      {#if thConfig.blacksmithUnlocked || slot.equipment.length > 0}
                        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {#each slot.equipment as eq (eq.uid)}
                            {@const eqItem = getItemById(eq.itemId)}
                            {#if eqItem}
                              <div
                                class="flex w-full min-w-0 items-center justify-between gap-1.5 rounded-lg border px-2 py-1.5 text-xs {eq.locked
                                  ? 'border-[var(--accent-border)] bg-[var(--accent-tint)] text-[var(--ink)]'
                                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink-secondary)]'}"
                              >
                                <div class="flex min-w-0 items-center gap-1.5">
                                  <UnitIcon item={eqItem} size={22} />
                                  <span class="truncate font-medium" title={eqItem.name}>
                                    {eqItem.name}
                                  </span>
                                </div>
                                <div class="flex shrink-0 items-center gap-0.5">
                                  <button
                                    type="button"
                                    disabled={spinStore.isSpinning}
                                    onclick={() =>
                                      triggerRespin({
                                        kind: 'pairedEquipment',
                                        heroUid: slot.uid,
                                        equipUid: eq.uid,
                                      })}
                                    class="icon-action cursor-pointer text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--accent)] disabled:opacity-40"
                                    title={spinStore.t.respinEquipTitle}
                                    aria-label="Re-spin {eqItem.name}"
                                  >
                                    <RotateCw class="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={spinStore.isSpinning}
                                    onclick={() =>
                                      spinStore.toggleLock({
                                        kind: 'pairedEquipment',
                                        heroUid: slot.uid,
                                        equipUid: eq.uid,
                                      })}
                                    class="icon-action cursor-pointer disabled:opacity-40 {lockClasses(
                                      eq.locked,
                                    )}"
                                    title={eq.locked
                                      ? spinStore.t.unlockTitle
                                      : spinStore.t.lockEquipTitle}
                                    aria-label="{spinStore.t.lockTitle} {eqItem.name}"
                                  >
                                    {#if eq.locked}
                                      <Lock class="h-3 w-3" />
                                    {:else}
                                      <Unlock class="h-3 w-3" />
                                    {/if}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={spinStore.isSpinning}
                                    onclick={() =>
                                      spinStore.removeSlot({
                                        kind: 'pairedEquipment',
                                        heroUid: slot.uid,
                                        equipUid: eq.uid,
                                      })}
                                    class="icon-action cursor-pointer text-[var(--muted)] hover:bg-[var(--danger-tint)] hover:text-[var(--danger)]"
                                    title={spinStore.t.removeEquipTitle}
                                    aria-label="{spinStore.t.removeTitle} {eqItem.name}"
                                  >
                                    <X class="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            {/if}
                          {/each}

                          {#if thConfig.blacksmithUnlocked && slot.equipment.length < 2}
                            {#each Array.from({ length: 2 - slot.equipment.length }, (_, idx) => idx) as emptyIdx (emptyIdx)}
                              <button
                                type="button"
                                disabled={spinStore.isSpinning}
                                onclick={() => spinStore.setCategory('equipment')}
                                class="flex min-h-9 w-full cursor-pointer items-center justify-center rounded-lg border border-dashed border-[var(--border-strong)] px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] transition-colors hover:border-[var(--accent-border)] hover:text-[var(--accent)] disabled:opacity-40"
                              >
                                {spinStore.t.addEquipSlot}
                              </button>
                            {/each}
                          {/if}
                        </div>
                      {/if}

                      {#if thConfig.maxPets > 0}
                        {#if slot.pet}
                          {@const petItem = getItemById(slot.pet.itemId)}
                          {#if petItem}
                            <div
                              class="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs {slot
                                .pet.locked
                                ? 'border-[var(--accent-border)] bg-[var(--accent-tint)] text-[var(--ink)]'
                                : 'border-[var(--positive-border)] bg-[var(--positive-tint)] text-[var(--ink)]'}"
                            >
                              <div class="flex min-w-0 items-center gap-2">
                                <UnitIcon item={petItem} size={22} />
                                <span class="truncate font-semibold" title={petItem.name}>
                                  {petItem.name}
                                </span>
                                <span
                                  class="shrink-0 rounded border border-[var(--positive-border)] bg-[var(--surface-inset)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--positive)]"
                                >
                                  Pet
                                </span>
                              </div>
                              <div class="flex shrink-0 items-center gap-0.5">
                                <button
                                  type="button"
                                  disabled={spinStore.isSpinning}
                                  onclick={() =>
                                    triggerRespin({ kind: 'pairedPet', heroUid: slot.uid })}
                                  class="icon-action cursor-pointer text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--accent)]"
                                  title={spinStore.t.respinPetTitle}
                                  aria-label="Re-spin {petItem.name}"
                                >
                                  <RotateCw class="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={spinStore.isSpinning}
                                  onclick={() =>
                                    spinStore.toggleLock({ kind: 'pairedPet', heroUid: slot.uid })}
                                  class="icon-action cursor-pointer {lockClasses(slot.pet.locked)}"
                                  title={slot.pet.locked
                                    ? spinStore.t.unlockPetTitle
                                    : spinStore.t.lockPetTitle}
                                  aria-label="{spinStore.t.lockTitle} {petItem.name}"
                                >
                                  {#if slot.pet.locked}
                                    <Lock class="h-3 w-3" />
                                  {:else}
                                    <Unlock class="h-3 w-3" />
                                  {/if}
                                </button>
                                <button
                                  type="button"
                                  disabled={spinStore.isSpinning}
                                  onclick={() =>
                                    spinStore.removeSlot({ kind: 'pairedPet', heroUid: slot.uid })}
                                  class="icon-action cursor-pointer text-[var(--ink-secondary)] hover:bg-[var(--danger-tint)] hover:text-[var(--danger)]"
                                  title={spinStore.t.removePetTitle}
                                  aria-label="{spinStore.t.removeTitle} {petItem.name}"
                                >
                                  <X class="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          {/if}
                        {:else}
                          <button
                            type="button"
                            disabled={spinStore.isSpinning}
                            onclick={() => spinStore.setCategory('pets')}
                            class="flex min-h-9 w-full cursor-pointer items-center justify-center rounded-lg border border-dashed border-[var(--border-strong)] px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] transition-colors hover:border-[var(--positive-border)] hover:text-[var(--positive)] disabled:opacity-40"
                          >
                            {spinStore.t.addPetSlot}
                          </button>
                        {/if}
                      {/if}
                    </div>
                  </div>
                {/if}
              {/each}
            </div>
          {/if}

          <!-- Unpaired Equipment Holding Row -->
          {#if spinStore.loadout.unpairedEquipment.length > 0}
            <div
              class="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-3"
            >
              <div class="mb-2 text-xs font-semibold text-[var(--ink-secondary)]">
                {spinStore.t.reserveEquipment}
              </div>
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {#each spinStore.loadout.unpairedEquipment as eq (eq.uid)}
                  {@const eqItem = getItemById(eq.itemId)}
                  {#if eqItem}
                    <div
                      class="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs {eq.locked
                        ? 'border-[var(--accent-border)] bg-[var(--accent-tint)] text-[var(--ink)]'
                        : 'border-[var(--border)] bg-[var(--surface-inset)] text-[var(--ink)]'}"
                    >
                      <div class="flex min-w-0 items-center gap-2">
                        <UnitIcon item={eqItem} size={24} />
                        <div class="min-w-0 leading-tight">
                          <div class="truncate font-semibold">{eqItem.name}</div>
                          <div class="truncate text-[11px] text-[var(--muted)]">
                            {getHeroById(eq.heroId)?.name ?? eq.heroId}
                          </div>
                        </div>
                      </div>
                      <div class="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          disabled={spinStore.isSpinning}
                          onclick={() =>
                            triggerRespin({ kind: 'unpairedEquipment', equipUid: eq.uid })}
                          class="icon-action cursor-pointer text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--accent)]"
                          title="Re-spin"
                          aria-label="Re-spin {eqItem.name}"
                        >
                          <RotateCw class="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={spinStore.isSpinning}
                          onclick={() =>
                            spinStore.toggleLock({ kind: 'unpairedEquipment', equipUid: eq.uid })}
                          class="icon-action cursor-pointer {lockClasses(eq.locked)}"
                          title={spinStore.t.lockTitle}
                          aria-label="{spinStore.t.lockTitle} {eqItem.name}"
                        >
                          {#if eq.locked}
                            <Lock class="h-3 w-3" />
                          {:else}
                            <Unlock class="h-3 w-3" />
                          {/if}
                        </button>
                        <button
                          type="button"
                          disabled={spinStore.isSpinning}
                          onclick={() =>
                            spinStore.removeSlot({ kind: 'unpairedEquipment', equipUid: eq.uid })}
                          class="icon-action cursor-pointer text-[var(--muted)] hover:bg-[var(--danger-tint)] hover:text-[var(--danger)]"
                          title={spinStore.t.removeTitle}
                          aria-label="{spinStore.t.removeTitle} {eqItem.name}"
                        >
                          <X class="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
          {/if}

          <!-- Unpaired Pets Holding Row -->
          {#if spinStore.loadout.unpairedPets.length > 0}
            <div
              class="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-3"
            >
              <div class="mb-2 text-xs font-semibold text-[var(--ink-secondary)]">
                {spinStore.t.reservePets}
              </div>
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {#each spinStore.loadout.unpairedPets as pet (pet.uid)}
                  {@const petItem = getItemById(pet.itemId)}
                  {#if petItem}
                    <div
                      class="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs {pet.locked
                        ? 'border-[var(--accent-border)] bg-[var(--accent-tint)] text-[var(--ink)]'
                        : 'border-[var(--positive-border)] bg-[var(--surface-inset)] text-[var(--ink)]'}"
                    >
                      <div class="flex min-w-0 items-center gap-2">
                        <UnitIcon item={petItem} size={24} />
                        <span class="truncate font-semibold">{petItem.name}</span>
                      </div>
                      <div class="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          disabled={spinStore.isSpinning}
                          onclick={() => triggerRespin({ kind: 'unpairedPet', petUid: pet.uid })}
                          class="icon-action cursor-pointer text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--accent)]"
                          title="Re-spin"
                          aria-label="Re-spin {petItem.name}"
                        >
                          <RotateCw class="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={spinStore.isSpinning}
                          onclick={() =>
                            spinStore.toggleLock({ kind: 'unpairedPet', petUid: pet.uid })}
                          class="icon-action cursor-pointer {lockClasses(pet.locked)}"
                          title={spinStore.t.lockTitle}
                          aria-label="{spinStore.t.lockTitle} {petItem.name}"
                        >
                          {#if pet.locked}
                            <Lock class="h-3 w-3" />
                          {:else}
                            <Unlock class="h-3 w-3" />
                          {/if}
                        </button>
                        <button
                          type="button"
                          disabled={spinStore.isSpinning}
                          onclick={() =>
                            spinStore.removeSlot({ kind: 'unpairedPet', petUid: pet.uid })}
                          class="icon-action cursor-pointer text-[var(--muted)] hover:bg-[var(--danger-tint)] hover:text-[var(--danger)]"
                          title={spinStore.t.removeTitle}
                          aria-label="{spinStore.t.removeTitle} {petItem.name}"
                        >
                          <X class="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}

      <!-- 2. Troops -->
      {#if spinStore.loadout.troops.length > 0}
        <div>
          <div class="mb-2.5 flex items-center justify-between">
            <h3 class="text-xs font-semibold text-[var(--ink)]">Troops</h3>
            <span class="font-mono text-xs text-[var(--muted)] tabular-nums">
              {spinStore.loadout.troops.length}
            </span>
          </div>
          <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {#each spinStore.loadout.troops as entry (entry.uid)}
              {@const item = getItemById(entry.itemId) as TroopItem | undefined}
              {#if item}
                {@const primaryRole = getPrimaryDisplayRole(item.roles, spinStore.filters.roles)}
                <div
                  class="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border px-3 py-2 transition-colors {entry.locked
                    ? 'border-l-2 border-[var(--accent-border)] border-l-[var(--accent)] bg-[var(--accent-tint)]'
                    : 'border-[var(--border)] bg-[var(--surface-inset)]'}"
                >
                  <div class="flex min-w-0 items-center gap-2.5">
                    <UnitIcon {item} size={34} />
                    <div class="min-w-0 leading-tight">
                      <div
                        class="truncate text-xs font-semibold text-[var(--ink)]"
                        title={item.name}
                      >
                        {item.name}
                      </div>
                      <div class="mt-1 flex items-center gap-1">
                        <span
                          title={spinStore.t.allRolesTitle(item.roles.join(', '))}
                          class="inline-flex min-w-[5.75rem] items-center justify-center rounded border px-1.5 py-0.5 text-[11px] font-medium {roleBadgeClasses(
                            primaryRole,
                          )}"
                        >
                          {primaryRole}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      disabled={spinStore.isSpinning}
                      onclick={() => triggerRespin({ kind: 'troop', uid: entry.uid })}
                      class="icon-action cursor-pointer text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--accent)]"
                      title="Re-spin"
                      aria-label="Re-spin {item.name}"
                    >
                      <RotateCw class="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={spinStore.isSpinning}
                      onclick={() => spinStore.toggleLock({ kind: 'troop', uid: entry.uid })}
                      class="icon-action cursor-pointer {lockClasses(entry.locked)}"
                      title={spinStore.t.lockTitle}
                      aria-label="{spinStore.t.lockTitle} {item.name}"
                    >
                      {#if entry.locked}
                        <Lock class="h-3.5 w-3.5" />
                      {:else}
                        <Unlock class="h-3.5 w-3.5" />
                      {/if}
                    </button>
                    <button
                      type="button"
                      disabled={spinStore.isSpinning}
                      onclick={() => spinStore.removeSlot({ kind: 'troop', uid: entry.uid })}
                      class="icon-action cursor-pointer text-[var(--muted)] hover:bg-[var(--danger-tint)] hover:text-[var(--danger)]"
                      title={spinStore.t.removeTitle}
                      aria-label="{spinStore.t.removeTitle} {item.name}"
                    >
                      <X class="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      {/if}

      <!-- 3. Super Troops, Spells & Siege -->
      {#if spinStore.loadout.superTroops.length > 0 || spinStore.loadout.spells.length > 0 || spinStore.loadout.siegeMachines.length > 0}
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          {#if spinStore.loadout.superTroops.length > 0}
            <div>
              <div class="mb-2.5 flex items-center justify-between">
                <h3 class="text-xs font-semibold text-[var(--ink)]">Super Troops</h3>
                <span class="font-mono text-xs text-[var(--muted)] tabular-nums">
                  {spinStore.loadout.superTroops.length}/{spinStore.filters.realisticLimits
                    ? thConfig.maxSuperTroops
                    : '∞'}
                </span>
              </div>
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1">
                {#each spinStore.loadout.superTroops as entry (entry.uid)}
                  {@const item = getItemById(entry.itemId) as SuperTroopItem | undefined}
                  {#if item}
                    {@const primaryRole = getPrimaryDisplayRole(
                      item.roles,
                      spinStore.filters.roles,
                    )}
                    <div
                      class="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border px-3 py-2 transition-colors {entry.locked
                        ? 'border-l-2 border-[var(--accent-border)] border-l-[var(--accent)] bg-[var(--accent-tint)]'
                        : 'border-[var(--border)] bg-[var(--surface-inset)]'}"
                    >
                      <div class="flex min-w-0 items-center gap-2.5">
                        <UnitIcon {item} size={32} />
                        <div class="min-w-0 leading-tight">
                          <div
                            class="truncate text-xs font-semibold text-[var(--ink)]"
                            title={item.name}
                          >
                            {item.name}
                          </div>
                          <div class="mt-1">
                            <span
                              title={spinStore.t.allRolesTitle(item.roles.join(', '))}
                              class="inline-flex min-w-[5.75rem] items-center justify-center rounded border px-1.5 py-0.5 text-[11px] font-medium {roleBadgeClasses(
                                primaryRole,
                              )}"
                            >
                              {primaryRole}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div class="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          disabled={spinStore.isSpinning}
                          onclick={() => triggerRespin({ kind: 'superTroop', uid: entry.uid })}
                          class="icon-action cursor-pointer text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--accent)]"
                          title="Re-spin"
                          aria-label="Re-spin {item.name}"
                        >
                          <RotateCw class="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={spinStore.isSpinning}
                          onclick={() =>
                            spinStore.toggleLock({ kind: 'superTroop', uid: entry.uid })}
                          class="icon-action cursor-pointer {lockClasses(entry.locked)}"
                          title={spinStore.t.lockTitle}
                          aria-label="{spinStore.t.lockTitle} {item.name}"
                        >
                          {#if entry.locked}
                            <Lock class="h-3.5 w-3.5" />
                          {:else}
                            <Unlock class="h-3.5 w-3.5" />
                          {/if}
                        </button>
                        <button
                          type="button"
                          disabled={spinStore.isSpinning}
                          onclick={() =>
                            spinStore.removeSlot({ kind: 'superTroop', uid: entry.uid })}
                          class="icon-action cursor-pointer text-[var(--muted)] hover:bg-[var(--danger-tint)] hover:text-[var(--danger)]"
                          title={spinStore.t.removeTitle}
                          aria-label="{spinStore.t.removeTitle} {item.name}"
                        >
                          <X class="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
          {/if}

          {#if spinStore.loadout.spells.length > 0}
            <div>
              <div class="mb-2.5 flex items-center justify-between">
                <h3 class="text-xs font-semibold text-[var(--ink)]">Spells</h3>
                <span class="font-mono text-xs text-[var(--muted)] tabular-nums">
                  {spinStore.loadout.spells.length}
                </span>
              </div>
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1">
                {#each spinStore.loadout.spells as entry (entry.uid)}
                  {@const item = getItemById(entry.itemId)}
                  {#if item}
                    <div
                      class="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border px-3 py-2 transition-colors {entry.locked
                        ? 'border-l-2 border-[var(--accent-border)] border-l-[var(--accent)] bg-[var(--accent-tint)]'
                        : 'border-[var(--border)] bg-[var(--surface-inset)]'}"
                    >
                      <div class="flex min-w-0 items-center gap-2.5">
                        <UnitIcon {item} size={32} />
                        <span
                          class="truncate text-xs font-semibold text-[var(--ink)]"
                          title={item.name}
                        >
                          {item.name}
                        </span>
                      </div>
                      <div class="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          disabled={spinStore.isSpinning}
                          onclick={() => triggerRespin({ kind: 'spell', uid: entry.uid })}
                          class="icon-action cursor-pointer text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--accent)]"
                          title="Re-spin"
                          aria-label="Re-spin {item.name}"
                        >
                          <RotateCw class="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={spinStore.isSpinning}
                          onclick={() => spinStore.toggleLock({ kind: 'spell', uid: entry.uid })}
                          class="icon-action cursor-pointer {lockClasses(entry.locked)}"
                          title={spinStore.t.lockTitle}
                          aria-label="{spinStore.t.lockTitle} {item.name}"
                        >
                          {#if entry.locked}
                            <Lock class="h-3.5 w-3.5" />
                          {:else}
                            <Unlock class="h-3.5 w-3.5" />
                          {/if}
                        </button>
                        <button
                          type="button"
                          disabled={spinStore.isSpinning}
                          onclick={() => spinStore.removeSlot({ kind: 'spell', uid: entry.uid })}
                          class="icon-action cursor-pointer text-[var(--muted)] hover:bg-[var(--danger-tint)] hover:text-[var(--danger)]"
                          title={spinStore.t.removeTitle}
                          aria-label="{spinStore.t.removeTitle} {item.name}"
                        >
                          <X class="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
          {/if}

          {#if spinStore.loadout.siegeMachines.length > 0}
            <div>
              <div class="mb-2.5 flex items-center justify-between">
                <h3 class="text-xs font-semibold text-[var(--ink)]">Siege Machine</h3>
                <span class="font-mono text-xs text-[var(--muted)] tabular-nums">
                  {spinStore.loadout.siegeMachines.length}/{spinStore.filters.realisticLimits
                    ? thConfig.maxSiege
                    : '∞'}
                </span>
              </div>
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1">
                {#each spinStore.loadout.siegeMachines as entry (entry.uid)}
                  {@const item = getItemById(entry.itemId)}
                  {#if item}
                    <div
                      class="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border px-3 py-2 transition-colors {entry.locked
                        ? 'border-l-2 border-[var(--accent-border)] border-l-[var(--accent)] bg-[var(--accent-tint)]'
                        : 'border-[var(--border)] bg-[var(--surface-inset)]'}"
                    >
                      <div class="flex min-w-0 items-center gap-2.5">
                        <UnitIcon {item} size={32} />
                        <span
                          class="truncate text-xs font-semibold text-[var(--ink)]"
                          title={item.name}
                        >
                          {item.name}
                        </span>
                      </div>
                      <div class="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          disabled={spinStore.isSpinning}
                          onclick={() => triggerRespin({ kind: 'siege', uid: entry.uid })}
                          class="icon-action cursor-pointer text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--accent)]"
                          title="Re-spin"
                          aria-label="Re-spin {item.name}"
                        >
                          <RotateCw class="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={spinStore.isSpinning}
                          onclick={() => spinStore.toggleLock({ kind: 'siege', uid: entry.uid })}
                          class="icon-action cursor-pointer {lockClasses(entry.locked)}"
                          title={spinStore.t.lockTitle}
                          aria-label="{spinStore.t.lockTitle} {item.name}"
                        >
                          {#if entry.locked}
                            <Lock class="h-3.5 w-3.5" />
                          {:else}
                            <Unlock class="h-3.5 w-3.5" />
                          {/if}
                        </button>
                        <button
                          type="button"
                          disabled={spinStore.isSpinning}
                          onclick={() => spinStore.removeSlot({ kind: 'siege', uid: entry.uid })}
                          class="icon-action cursor-pointer text-[var(--muted)] hover:bg-[var(--danger-tint)] hover:text-[var(--danger)]"
                          title={spinStore.t.removeTitle}
                          aria-label="{spinStore.t.removeTitle} {item.name}"
                        >
                          <X class="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</section>

<ExportCard
  loadout={spinStore.loadout}
  townHall={spinStore.townHall}
  bind:cardRef={exportCardRef}
/>
