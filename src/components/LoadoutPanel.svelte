<script lang="ts">
  import {
    Copy,
    Download,
    Lock,
    Unlock,
    RotateCw,
    Trash2,
    X,
    Check,
    Eraser,
  } from 'lucide-svelte';
  import { getHeroById, getItemById, getTownHallConfig } from '../data';
  import type { SlotTarget, TroopItem, SuperTroopItem, TroopRole } from '../data/types';
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
    const text = formatLoadoutText(spinStore.loadout, spinStore.townHall);
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      spinStore.showToast('Loadout berhasil disalin ke clipboard (siap paste ke WA/Discord)!');
      setTimeout(() => {
        copied = false;
      }, 2000);
    } catch {
      spinStore.showToast('Gagal menyalin otomatis — pastikan izin clipboard browser aktif.');
    }
  }

  async function handleDownloadPng(): Promise<void> {
    if (isEmpty || !exportCardRef || exporting) return;
    exporting = true;
    try {
      await exportElementToPng(exportCardRef, `coc-attack-spin-th${spinStore.townHall}.png`);
      spinStore.showToast('Kartu loadout PNG berhasil diunduh!');
    } catch {
      spinStore.showToast('Gagal membuat gambar PNG. Coba lagi.');
    } finally {
      exporting = false;
    }
  }

  function lockClasses(locked: boolean): string {
    return locked
      ? 'text-amber-300 bg-amber-500/20 hover:bg-amber-500/30'
      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800';
  }

  function roleBadgeClasses(role: TroopRole): string {
    switch (role) {
      case 'Main':
        return 'bg-amber-500/15 text-amber-300 ring-amber-400/25';
      case 'Tank':
        return 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/25';
      case 'Support':
        return 'bg-sky-500/15 text-sky-300 ring-sky-400/25';
      case 'Damage Dealer':
        return 'bg-rose-500/15 text-rose-300 ring-rose-400/25';
      case 'Funnel':
        return 'bg-purple-500/15 text-purple-300 ring-purple-400/25';
      case 'Clean-up':
        return 'bg-slate-700/60 text-slate-300 ring-slate-600/40';
    }
  }

  function triggerRespin(target: SlotTarget): void {
    spinStore.startSlotRespin(target);
  }
</script>

<section
  class="rounded-2xl border border-slate-800 bg-slate-900/85 p-4 shadow-xl backdrop-blur-sm sm:p-5"
>
  <!-- Header & Action Bar -->
  <div class="mb-5 flex flex-col justify-between gap-3 border-b border-slate-800 pb-4 sm:flex-row sm:items-center">
    <div class="flex items-center gap-2">
      <h2 class="text-base font-extrabold text-white">Loadout</h2>
      <span class="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-300 ring-1 ring-amber-400/30">
        TH{spinStore.townHall}
      </span>
      <span class="text-xs text-slate-400">
        {spinStore.totalPickedCount} terpilih
      </span>
    </div>

    <div class="grid w-full shrink-0 grid-cols-2 gap-2 sm:w-72 lg:w-auto lg:grid-cols-4">
      <button
        type="button"
        disabled={isEmpty}
        onclick={handleCopyText}
        class="inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs font-semibold text-slate-100 transition-colors hover:border-amber-400/60 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 sm:py-1.5"
      >
        {#if copied}
          <Check class="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          Tersalin!
        {:else}
          <Copy class="h-3.5 w-3.5 shrink-0 text-amber-300" />
          Copy Teks
        {/if}
      </button>

      <button
        type="button"
        disabled={isEmpty || exporting}
        onclick={handleDownloadPng}
        class="inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-purple-500/50 bg-purple-600/20 px-3 py-2 text-xs font-semibold text-purple-100 transition-colors hover:bg-purple-600/35 disabled:cursor-not-allowed disabled:opacity-40 sm:py-1.5"
      >
        <Download class="h-3.5 w-3.5 shrink-0" />
        {exporting ? 'Membuat PNG...' : 'Export PNG'}
      </button>

      <button
        type="button"
        disabled={isEmpty || spinStore.isSpinning}
        onclick={() => spinStore.clearUnlocked()}
        class="inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-700/80 bg-slate-950/70 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-amber-400/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:py-1.5"
        title="Hapus semua slot yang tidak dikunci"
      >
        <Eraser class="h-3.5 w-3.5 shrink-0" />
        Clear Unlocked
      </button>

      <button
        type="button"
        disabled={isEmpty || spinStore.isSpinning}
        onclick={() => spinStore.clearAll()}
        class="inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-200 transition-colors hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40 sm:py-1.5"
      >
        <Trash2 class="h-3.5 w-3.5 shrink-0" />
        Clear All
      </button>
    </div>
  </div>

  {#if isEmpty}
    <div class="rounded-xl border border-dashed border-slate-800 bg-slate-950/50 px-4 py-8 text-center">
      <p class="text-sm font-semibold text-slate-300">Belum ada unit terpilih</p>
      <p class="mt-1 text-xs text-slate-500">Klik <strong class="text-amber-300">SPIN!</strong> untuk mulai.</p>
    </div>
  {:else}
    <div class="space-y-6">
      <!-- 1. Heroes, Equipment & Pets -->
      {#if spinStore.loadout.heroes.length > 0 || spinStore.loadout.unpairedEquipment.length > 0 || spinStore.loadout.unpairedPets.length > 0}
        <div>
          <div class="mb-2.5 flex items-center justify-between">
            <h3 class="text-xs font-bold tracking-wider text-amber-300 uppercase">
              Heroes & Companions
            </h3>
            <span class="text-xs font-medium text-slate-400">
              Heroes {spinStore.loadout.heroes.length}/{spinStore.filters.realisticLimits ? thConfig.maxActiveHeroes : '∞'}
              {#if thConfig.maxPets > 0}
                • Pets {spinStore.loadout.heroes.filter((h) => h.pet).length + spinStore.loadout.unpairedPets.length}/{spinStore.filters.realisticLimits ? thConfig.maxPets : '∞'}
              {/if}
            </span>
          </div>

          {#if spinStore.loadout.heroes.length > 0}
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
              {#each spinStore.loadout.heroes as slot (slot.uid)}
                {@const hero = getHeroById(slot.heroId)}
                {#if hero}
                  <div
                    class="flex flex-col justify-between rounded-xl border p-3.5 transition-colors {slot.locked
                      ? 'border-amber-400/60 bg-amber-500/5'
                      : 'border-slate-800 bg-slate-950/75'}"
                  >
                    <!-- Hero Header Row -->
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex min-w-0 items-center gap-2.5">
                        <UnitIcon item={hero} size={42} class="border-amber-400/50" />
                        <div class="min-w-0">
                          <div class="truncate text-sm font-bold text-white">{hero.name}</div>
                          <div class="text-[11px] text-slate-400">
                            Equip {slot.equipment.length}/2 {thConfig.maxPets > 0 ? `• ${slot.pet ? '1/1 Pet' : '0/1 Pet'}` : ''}
                          </div>
                        </div>
                      </div>

                      <div class="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          disabled={spinStore.isSpinning}
                          onclick={() => triggerRespin({ kind: 'hero', heroUid: slot.uid })}
                          class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-amber-300 disabled:opacity-40"
                          title="Re-spin Hero ini"
                          aria-label="Re-spin {hero.name}"
                        >
                          <RotateCw class="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={spinStore.isSpinning}
                          onclick={() => spinStore.toggleLock({ kind: 'hero', heroUid: slot.uid })}
                          class="rounded-lg p-1.5 transition-colors disabled:opacity-40 {lockClasses(slot.locked)}"
                          title={slot.locked ? 'Buka kunci Hero' : 'Kunci Hero'}
                          aria-label="Kunci {hero.name}"
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
                          class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-500/20 hover:text-rose-300 disabled:opacity-40"
                          title="Hapus Hero ini"
                          aria-label="Hapus {hero.name}"
                        >
                          <X class="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <!-- Aligned Sub-grid: 2-col Equipment + full-width Pet -->
                    <div class="mt-3 space-y-2 border-t border-slate-800/80 pt-2.5">
                      {#if thConfig.blacksmithUnlocked || slot.equipment.length > 0}
                        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {#each slot.equipment as eq (eq.uid)}
                            {@const eqItem = getItemById(eq.itemId)}
                            {#if eqItem}
                              <div
                                class="flex w-full min-w-0 items-center justify-between gap-1.5 rounded-lg border px-2 py-1.5 text-xs {eq.locked
                                  ? 'border-amber-400/50 bg-amber-500/10 text-amber-100'
                                  : 'border-slate-800 bg-slate-900/90 text-slate-200'}"
                              >
                                <div class="flex min-w-0 items-center gap-1.5">
                                  <UnitIcon item={eqItem} size={22} />
                                  <span class="truncate font-medium" title={eqItem.name}>{eqItem.name}</span>
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
                                    class="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-amber-300 disabled:opacity-40"
                                    title="Re-spin equipment ini"
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
                                    class="rounded p-1 {eq.locked ? 'text-amber-300' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'}"
                                    title={eq.locked ? 'Buka kunci' : 'Kunci equipment'}
                                    aria-label="Kunci {eqItem.name}"
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
                                    class="rounded p-1 text-slate-500 hover:bg-rose-500/20 hover:text-rose-300"
                                    title="Hapus equipment"
                                    aria-label="Hapus {eqItem.name}"
                                  >
                                    <X class="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            {/if}
                          {/each}

                          {#if thConfig.blacksmithUnlocked && slot.equipment.length < 2}
                            {#each Array.from({ length: 2 - slot.equipment.length }) as _}
                              <button
                                type="button"
                                disabled={spinStore.isSpinning}
                                onclick={() => spinStore.setCategory('equipment')}
                                class="flex w-full items-center justify-center rounded-lg border border-dashed border-slate-700/80 px-2.5 py-2 text-[11px] font-medium text-slate-500 transition-colors hover:border-purple-400/60 hover:text-purple-300"
                              >
                                + Slot Equip
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
                              class="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs {slot.pet.locked
                                ? 'border-amber-400/50 bg-amber-500/10 text-amber-100'
                                : 'border-emerald-700/50 bg-emerald-950/35 text-emerald-100'}"
                            >
                              <div class="flex min-w-0 items-center gap-2">
                                <UnitIcon item={petItem} size={22} />
                                <span class="truncate font-semibold" title={petItem.name}>{petItem.name}</span>
                                <span class="shrink-0 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                                  Pet
                                </span>
                              </div>
                              <div class="flex shrink-0 items-center gap-0.5">
                                <button
                                  type="button"
                                  disabled={spinStore.isSpinning}
                                  onclick={() => triggerRespin({ kind: 'pairedPet', heroUid: slot.uid })}
                                  class="rounded p-1 text-emerald-300/75 hover:bg-emerald-900/50 hover:text-amber-300"
                                  title="Re-spin Pet ini"
                                  aria-label="Re-spin {petItem.name}"
                                >
                                  <RotateCw class="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={spinStore.isSpinning}
                                  onclick={() => spinStore.toggleLock({ kind: 'pairedPet', heroUid: slot.uid })}
                                  class="rounded p-1 {slot.pet.locked ? 'text-amber-300' : 'text-emerald-300/65 hover:bg-emerald-900/50 hover:text-white'}"
                                  title={slot.pet.locked ? 'Buka kunci Pet' : 'Kunci Pet'}
                                  aria-label="Kunci {petItem.name}"
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
                                  onclick={() => spinStore.removeSlot({ kind: 'pairedPet', heroUid: slot.uid })}
                                  class="rounded p-1 text-emerald-300/65 hover:bg-rose-500/20 hover:text-rose-300"
                                  title="Hapus Pet"
                                  aria-label="Hapus {petItem.name}"
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
                            class="flex w-full items-center justify-center rounded-lg border border-dashed border-emerald-800/70 px-2.5 py-1.5 text-[11px] font-medium text-emerald-500/80 transition-colors hover:border-emerald-400/60 hover:text-emerald-300"
                          >
                            + Slot Pet
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
            <div class="mt-3 rounded-xl border border-purple-500/30 bg-purple-500/5 p-3">
              <div class="mb-2 text-[11px] font-bold tracking-wide text-purple-300 uppercase">
                Equipment Cadangan
              </div>
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {#each spinStore.loadout.unpairedEquipment as eq (eq.uid)}
                  {@const eqItem = getItemById(eq.itemId)}
                  {#if eqItem}
                    <div
                      class="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs {eq.locked
                        ? 'border-amber-400/60 bg-amber-500/10 text-amber-100'
                        : 'border-slate-700 bg-slate-900 text-slate-200'}"
                    >
                      <div class="flex min-w-0 items-center gap-2">
                        <UnitIcon item={eqItem} size={24} />
                        <div class="min-w-0 leading-tight">
                          <div class="truncate font-semibold">{eqItem.name}</div>
                          <div class="truncate text-[10px] text-purple-300">
                            {getHeroById(eq.heroId)?.name ?? eq.heroId}
                          </div>
                        </div>
                      </div>
                      <div class="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          disabled={spinStore.isSpinning}
                          onclick={() => triggerRespin({ kind: 'unpairedEquipment', equipUid: eq.uid })}
                          class="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-amber-300"
                          title="Re-spin"
                          aria-label="Re-spin {eqItem.name}"
                        >
                          <RotateCw class="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={spinStore.isSpinning}
                          onclick={() => spinStore.toggleLock({ kind: 'unpairedEquipment', equipUid: eq.uid })}
                          class="rounded p-1 {eq.locked ? 'text-amber-300' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}"
                          title="Kunci"
                          aria-label="Kunci {eqItem.name}"
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
                          onclick={() => spinStore.removeSlot({ kind: 'unpairedEquipment', equipUid: eq.uid })}
                          class="rounded p-1 text-slate-500 hover:bg-rose-500/20 hover:text-rose-300"
                          title="Hapus"
                          aria-label="Hapus {eqItem.name}"
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
            <div class="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
              <div class="mb-2 text-[11px] font-bold tracking-wide text-emerald-300 uppercase">
                Pets Cadangan
              </div>
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {#each spinStore.loadout.unpairedPets as pet (pet.uid)}
                  {@const petItem = getItemById(pet.itemId)}
                  {#if petItem}
                    <div
                      class="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs {pet.locked
                        ? 'border-amber-400/60 bg-amber-500/10 text-amber-100'
                        : 'border-emerald-800/80 bg-slate-900 text-emerald-100'}"
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
                          class="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-amber-300"
                          title="Re-spin"
                          aria-label="Re-spin {petItem.name}"
                        >
                          <RotateCw class="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={spinStore.isSpinning}
                          onclick={() => spinStore.toggleLock({ kind: 'unpairedPet', petUid: pet.uid })}
                          class="rounded p-1 {pet.locked ? 'text-amber-300' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}"
                          title="Kunci"
                          aria-label="Kunci {petItem.name}"
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
                          onclick={() => spinStore.removeSlot({ kind: 'unpairedPet', petUid: pet.uid })}
                          class="rounded p-1 text-slate-500 hover:bg-rose-500/20 hover:text-rose-300"
                          title="Hapus"
                          aria-label="Hapus {petItem.name}"
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

      <!-- 2. Troops (Clean Uniform Grid with 1 Most Relevant Role) -->
      {#if spinStore.loadout.troops.length > 0}
        <div>
          <h3 class="mb-2.5 text-xs font-bold tracking-wider text-slate-300 uppercase">
            Troops ({spinStore.loadout.troops.length})
          </h3>
          <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {#each spinStore.loadout.troops as entry (entry.uid)}
              {@const item = getItemById(entry.itemId) as TroopItem | undefined}
              {#if item}
                {@const primaryRole = getPrimaryDisplayRole(item.roles, spinStore.filters.roles)}
                <div
                  class="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border px-3 py-2 transition-colors {entry.locked
                    ? 'border-amber-400/60 bg-amber-500/10'
                    : 'border-slate-800 bg-slate-950/80'}"
                >
                  <div class="flex min-w-0 items-center gap-2.5">
                    <UnitIcon {item} size={34} />
                    <div class="min-w-0 leading-tight">
                      <div class="truncate text-xs font-bold text-white" title={item.name}>
                        {item.name}
                      </div>
                      <div class="mt-1 flex items-center gap-1">
                        <span
                          title="Semua role: {item.roles.join(', ')}"
                          class="inline-flex w-24 items-center justify-center whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1 {roleBadgeClasses(primaryRole)}"
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
                      class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-amber-300"
                      title="Re-spin"
                      aria-label="Re-spin {item.name}"
                    >
                      <RotateCw class="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={spinStore.isSpinning}
                      onclick={() => spinStore.toggleLock({ kind: 'troop', uid: entry.uid })}
                      class="rounded-lg p-1.5 transition-colors {lockClasses(entry.locked)}"
                      title="Kunci"
                      aria-label="Kunci {item.name}"
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
                      class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-500/20 hover:text-rose-300"
                      title="Hapus"
                      aria-label="Hapus {item.name}"
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

      <!-- 3. Super Troops, Spells & Siege (Uniform Full-Width Cards per Column) -->
      {#if spinStore.loadout.superTroops.length > 0 || spinStore.loadout.spells.length > 0 || spinStore.loadout.siegeMachines.length > 0}
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          {#if spinStore.loadout.superTroops.length > 0}
            <div>
              <h3 class="mb-2.5 text-xs font-bold tracking-wider text-fuchsia-300 uppercase">
                Super Troops ({spinStore.loadout.superTroops.length}/{spinStore.filters.realisticLimits ? thConfig.maxSuperTroops : '∞'})
              </h3>
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1">
                {#each spinStore.loadout.superTroops as entry (entry.uid)}
                  {@const item = getItemById(entry.itemId) as SuperTroopItem | undefined}
                  {#if item}
                    {@const primaryRole = getPrimaryDisplayRole(item.roles, spinStore.filters.roles)}
                    <div
                      class="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border px-3 py-2 {entry.locked
                        ? 'border-amber-400/60 bg-amber-500/10'
                        : 'border-fuchsia-800/50 bg-fuchsia-950/20'}"
                    >
                      <div class="flex min-w-0 items-center gap-2.5">
                        <UnitIcon {item} size={32} />
                        <div class="min-w-0 leading-tight">
                          <div class="truncate text-xs font-bold text-white" title={item.name}>
                            {item.name}
                          </div>
                          <div class="mt-1">
                            <span
                              title="Semua role: {item.roles.join(', ')}"
                              class="inline-flex w-24 items-center justify-center whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1 {roleBadgeClasses(primaryRole)}"
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
                          class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-amber-300"
                          title="Re-spin"
                          aria-label="Re-spin {item.name}"
                        >
                          <RotateCw class="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={spinStore.isSpinning}
                          onclick={() => spinStore.toggleLock({ kind: 'superTroop', uid: entry.uid })}
                          class="rounded-lg p-1.5 transition-colors {lockClasses(entry.locked)}"
                          title="Kunci"
                          aria-label="Kunci {item.name}"
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
                          onclick={() => spinStore.removeSlot({ kind: 'superTroop', uid: entry.uid })}
                          class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-500/20 hover:text-rose-300"
                          title="Hapus"
                          aria-label="Hapus {item.name}"
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
              <h3 class="mb-2.5 text-xs font-bold tracking-wider text-sky-300 uppercase">
                Spells ({spinStore.loadout.spells.length})
              </h3>
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1">
                {#each spinStore.loadout.spells as entry (entry.uid)}
                  {@const item = getItemById(entry.itemId)}
                  {#if item}
                    <div
                      class="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border px-3 py-2 {entry.locked
                        ? 'border-amber-400/60 bg-amber-500/10'
                        : 'border-sky-900/60 bg-slate-950/80'}"
                    >
                      <div class="flex min-w-0 items-center gap-2.5">
                        <UnitIcon {item} size={32} />
                        <span class="truncate text-xs font-bold text-white" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                      <div class="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          disabled={spinStore.isSpinning}
                          onclick={() => triggerRespin({ kind: 'spell', uid: entry.uid })}
                          class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-amber-300"
                          title="Re-spin"
                          aria-label="Re-spin {item.name}"
                        >
                          <RotateCw class="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={spinStore.isSpinning}
                          onclick={() => spinStore.toggleLock({ kind: 'spell', uid: entry.uid })}
                          class="rounded-lg p-1.5 transition-colors {lockClasses(entry.locked)}"
                          title="Kunci"
                          aria-label="Kunci {item.name}"
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
                          class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-500/20 hover:text-rose-300"
                          title="Hapus"
                          aria-label="Hapus {item.name}"
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
              <h3 class="mb-2.5 text-xs font-bold tracking-wider text-rose-300 uppercase">
                Siege Machine ({spinStore.loadout.siegeMachines.length}/{spinStore.filters.realisticLimits ? thConfig.maxSiege : '∞'})
              </h3>
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1">
                {#each spinStore.loadout.siegeMachines as entry (entry.uid)}
                  {@const item = getItemById(entry.itemId)}
                  {#if item}
                    <div
                      class="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border px-3 py-2 {entry.locked
                        ? 'border-amber-400/60 bg-amber-500/10'
                        : 'border-rose-900/60 bg-slate-950/80'}"
                    >
                      <div class="flex min-w-0 items-center gap-2.5">
                        <UnitIcon {item} size={32} />
                        <span class="truncate text-xs font-bold text-white" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                      <div class="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          disabled={spinStore.isSpinning}
                          onclick={() => triggerRespin({ kind: 'siege', uid: entry.uid })}
                          class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-amber-300"
                          title="Re-spin"
                          aria-label="Re-spin {item.name}"
                        >
                          <RotateCw class="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={spinStore.isSpinning}
                          onclick={() => spinStore.toggleLock({ kind: 'siege', uid: entry.uid })}
                          class="rounded-lg p-1.5 transition-colors {lockClasses(entry.locked)}"
                          title="Kunci"
                          aria-label="Kunci {item.name}"
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
                          class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-500/20 hover:text-rose-300"
                          title="Hapus"
                          aria-label="Hapus {item.name}"
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

<ExportCard loadout={spinStore.loadout} townHall={spinStore.townHall} bind:cardRef={exportCardRef} />
