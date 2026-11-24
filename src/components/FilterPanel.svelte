<script lang="ts">
  import { Filter, Link2, RotateCcw, AlertTriangle, ArrowRight } from 'lucide-svelte';
  import { ALL_TROOP_ROLES, getHeroById } from '../data';
  import type { MovementFilter } from '../data/types';
  import { spinStore } from '../stores/spinStore.svelte';

  let cat = $derived(spinStore.activeCategory);
  let pool = $derived(spinStore.poolResult);
  let hasTroopFilters = $derived(
    spinStore.filters.roles.length > 0 || spinStore.filters.movement !== 'all',
  );

  let chosenHeroNames = $derived(
    spinStore.loadout.heroes.map((h) => getHeroById(h.heroId)?.name ?? h.heroId),
  );

  let unpairedEquipHeroNames = $derived.by(() => {
    const chosen = new Set(spinStore.loadout.heroes.map((h) => h.heroId));
    const names = new Set<string>();
    for (const eq of spinStore.loadout.unpairedEquipment) {
      if (!chosen.has(eq.heroId)) {
        names.add(getHeroById(eq.heroId)?.name ?? eq.heroId);
      }
    }
    return [...names];
  });

  const movementOptions: { value: MovementFilter; label: string }[] = [
    { value: 'all', label: 'Semua' },
    { value: 'ground', label: 'Ground' },
    { value: 'air', label: 'Air' },
  ];
</script>

<section
  class="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl backdrop-blur-sm sm:p-5"
>
  <div class="mb-3 flex items-center justify-between gap-2">
    <div class="flex items-center gap-2">
      <Filter class="h-4 w-4 text-amber-300" />
      <h2 class="text-sm font-bold tracking-wide text-amber-300 uppercase">Filter Kontekstual</h2>
    </div>
    {#if (cat === 'troops' || cat === 'superTroops') && hasTroopFilters}
      <button
        type="button"
        disabled={spinStore.isSpinning}
        onclick={() => spinStore.resetTroopFilters()}
        class="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white disabled:opacity-50"
      >
        <RotateCcw class="h-3 w-3" />
        Reset Filter
      </button>
    {/if}
  </div>

  <!-- 1. Troops & Super Troops Role Filter -->
  {#if cat === 'troops' || cat === 'superTroops'}
    <div class="space-y-3">
      <div>
        <div class="mb-1.5 flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-300">Role / Tag Unit</span>
          <span class="text-[11px] text-slate-400">
            {spinStore.filters.roles.length === 0
              ? 'Semua OFF = Murni Random'
              : `${spinStore.filters.roles.length} role aktif`}
          </span>
        </div>
        <div class="flex flex-wrap gap-1.5">
          {#each ALL_TROOP_ROLES as role (role)}
            {@const active = spinStore.filters.roles.includes(role)}
            <button
              type="button"
              disabled={spinStore.isSpinning}
              onclick={() => spinStore.toggleRole(role)}
              aria-pressed={active}
              class="rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all disabled:opacity-50 {active
                ? 'border-amber-400 bg-amber-500/20 text-amber-200 shadow-sm'
                : 'border-slate-700/80 bg-slate-950/70 text-slate-400 hover:border-slate-500 hover:text-slate-200'}"
            >
              {role}
            </button>
          {/each}
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
        <!-- OR / AND Match Mode -->
        <div class="flex items-center gap-1.5">
          <span class="text-[11px] font-medium text-slate-400">Cocokkan:</span>
          <div class="inline-flex rounded-lg border border-slate-700/80 bg-slate-950 p-0.5">
            <button
              type="button"
              disabled={spinStore.isSpinning}
              onclick={() => spinStore.setMatchMode('OR')}
              aria-pressed={spinStore.filters.matchMode === 'OR'}
              class="rounded-md px-2 py-0.5 text-[11px] font-bold transition-colors {spinStore.filters.matchMode === 'OR'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'}"
            >
              OR
            </button>
            <button
              type="button"
              disabled={spinStore.isSpinning}
              onclick={() => spinStore.setMatchMode('AND')}
              aria-pressed={spinStore.filters.matchMode === 'AND'}
              class="rounded-md px-2 py-0.5 text-[11px] font-bold transition-colors {spinStore.filters.matchMode === 'AND'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'}"
            >
              AND
            </button>
          </div>
        </div>

        <!-- Movement Filter -->
        <div class="inline-flex rounded-lg border border-slate-700/80 bg-slate-950 p-0.5">
          {#each movementOptions as opt (opt.value)}
            <button
              type="button"
              disabled={spinStore.isSpinning}
              onclick={() => spinStore.setMovement(opt.value)}
              aria-pressed={spinStore.filters.movement === opt.value}
              class="rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors {spinStore.filters.movement === opt.value
                ? 'bg-amber-500/25 text-amber-200'
                : 'text-slate-400 hover:text-white'}"
            >
              {opt.label}
            </button>
          {/each}
        </div>
      </div>
    </div>

  <!-- 2. Bidirectional Hero <-> Equipment Relevance Filter -->
  {:else if cat === 'heroes' || cat === 'equipment'}
    <div class="space-y-2.5">
      <div class="flex items-start justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
        <div class="space-y-1">
          <div class="flex items-center gap-1.5 text-xs font-bold text-slate-100">
            <Link2 class="h-3.5 w-3.5 text-purple-400" />
            <span>Hanya Relevan ({cat === 'equipment' ? 'Hero → Equipment' : 'Equipment → Hero'})</span>
          </div>
          <p class="text-[11px] leading-relaxed text-slate-400">
            {#if cat === 'equipment'}
              {#if chosenHeroNames.length > 0}
                {#if pool.relevanceEffective}
                  Menyaring equipment khusus untuk Hero terpilih: <strong class="text-slate-200">{chosenHeroNames.join(', ')}</strong> (maks 2/Hero).
                {:else}
                  Filter dimatikan — semua equipment TH{spinStore.townHall} ditampilkan di roda.
                {/if}
              {:else}
                Otomatis aktif begitu kamu sudah spin minimal 1 Hero.
              {/if}
            {:else}
              {#if unpairedEquipHeroNames.length > 0}
                {#if pool.relevanceEffective}
                  Menyaring Hero pemilik Equipment yang belum terpasang: <strong class="text-slate-200">{unpairedEquipHeroNames.join(', ')}</strong>.
                {:else}
                  Filter dimatikan — semua Hero TH{spinStore.townHall} ditampilkan di roda.
                {/if}
              {:else}
                Semua Equipment sudah terpasang / belum ada Equipment cadangan — semua sisa Hero bebas di-spin.
              {/if}
            {/if}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-label="Toggle filter hanya relevan Hero dan Equipment"
          aria-checked={pool.relevanceEffective}
          disabled={spinStore.isSpinning || (cat === 'equipment' ? chosenHeroNames.length === 0 : unpairedEquipHeroNames.length === 0)}
          onclick={() => spinStore.toggleRelevance(cat)}
          class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-slate-700 transition-colors disabled:cursor-not-allowed disabled:opacity-40 {pool.relevanceEffective
            ? 'bg-purple-600'
            : 'bg-slate-800'}"
        >
          <span
            class="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform {pool.relevanceEffective
              ? 'translate-x-5'
              : 'translate-x-1'}"
          ></span>
        </button>
      </div>
    </div>

  <!-- 3. Siege Machines CC Donation Toggle -->
  {:else if cat === 'siegeMachines'}
    <div class="flex items-start justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
      <div class="space-y-1">
        <div class="text-xs font-bold text-slate-100">Termasuk Donasi CC (TH10+)</div>
        <p class="text-[11px] leading-relaxed text-slate-400">
          {#if spinStore.filters.includeCcSiege}
            Semua Siege Machine tersedia mulai TH10 sesuai kapasitas donasi Clan Castle.
          {:else}
            Hanya menampilkan Siege Machine yang sudah unlock di Workshop (TH12+).
          {/if}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-label="Toggle Siege Machine donasi Clan Castle TH10+"
        aria-checked={spinStore.filters.includeCcSiege}
        disabled={spinStore.isSpinning}
        onclick={() => spinStore.toggleIncludeCcSiege()}
        class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-slate-700 transition-colors disabled:opacity-50 {spinStore.filters.includeCcSiege
          ? 'bg-amber-500'
          : 'bg-slate-800'}"
      >
        <span
          class="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform {spinStore.filters.includeCcSiege
            ? 'translate-x-5'
            : 'translate-x-1'}"
        ></span>
      </button>
    </div>

  <!-- 4. Spells & Pets Info -->
  {:else}
    <p class="text-xs leading-relaxed text-slate-400">
      {#if cat === 'pets'}
        Menampilkan seluruh Pet yang unlock di Pet House TH{spinStore.townHall}. Pet otomatis dipasangkan ke Hero aktif yang belum memiliki Pet (maks {pool.slotUsage.max ?? '∞'}).
      {:else}
        Menampilkan seluruh Elixir & Dark Spell yang unlock di TH{spinStore.townHall}. Gunakan tombol <strong>Anti-Duplikat</strong> di atas jika tidak ingin spell yang sama muncul dua kali.
      {/if}
    </p>
  {/if}

  <!-- Contextual Empty Pool Recovery Banner -->
  {#if pool.emptyReason}
    <div class="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-100">
      <div class="mb-2 flex items-start gap-2">
        <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <div>
          {#if pool.emptyReason === 'no-role-match'}
            <p class="font-semibold">Tidak ada unit yang cocok dengan kombinasi filter saat ini.</p>
          {:else if pool.emptyReason === 'all-heroes-equipped'}
            <p class="font-semibold">Semua Hero terpilih sudah memiliki 2/2 Equipment.</p>
          {:else if pool.emptyReason === 'no-relevant-heroes'}
            <p class="font-semibold">Semua Hero yang cocok dengan Equipment sudah terpilih.</p>
          {:else if pool.emptyReason === 'slot-full'}
            <p class="font-semibold">
              Batas slot kategori ini sudah penuh ({pool.slotUsage.used}/{pool.slotUsage.max} di TH{spinStore.townHall}).
            </p>
          {:else if pool.emptyReason === 'all-picked'}
            <p class="font-semibold">Semua unit di pool ini sudah masuk loadout.</p>
          {:else}
            <p class="font-semibold">Kategori belum terbuka untuk pengaturan TH saat ini.</p>
          {/if}
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        {#if pool.emptyReason === 'no-role-match'}
          <button
            type="button"
            onclick={() => spinStore.resetTroopFilters()}
            class="rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-bold text-slate-950 transition-colors hover:bg-amber-400"
          >
            Reset Filter Role
          </button>
        {:else if pool.emptyReason === 'all-heroes-equipped'}
          {#if spinStore.availableCategories.includes('heroes')}
            <button
              type="button"
              onclick={() => spinStore.setCategory('heroes')}
              class="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-2.5 py-1 text-xs font-bold text-white transition-colors hover:bg-purple-500"
            >
              Lanjut Spin Hero
              <ArrowRight class="h-3.5 w-3.5" />
            </button>
          {/if}
          <button
            type="button"
            onclick={() => spinStore.toggleRelevance('equipment', false)}
            class="rounded-lg border border-amber-400/50 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-amber-200 hover:bg-slate-800"
          >
            Matikan Filter Relevan
          </button>
        {:else if pool.emptyReason === 'no-relevant-heroes'}
          <button
            type="button"
            onclick={() => spinStore.toggleRelevance('heroes', false)}
            class="rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-bold text-slate-950 hover:bg-amber-400"
          >
            Matikan Filter Relevan & Lanjut Isi Sisa Hero
          </button>
        {:else if pool.emptyReason === 'slot-full'}
          <button
            type="button"
            onclick={() => spinStore.toggleRealisticLimits()}
            class="rounded-lg border border-amber-400/50 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-amber-200 hover:bg-slate-800"
          >
            Matikan Batas Realistis TH
          </button>
        {:else if pool.emptyReason === 'all-picked' && (cat === 'troops' || cat === 'spells')}
          <button
            type="button"
            onclick={() => spinStore.toggleAntiDuplicate()}
            class="rounded-lg border border-amber-400/50 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-amber-200 hover:bg-slate-800"
          >
            Matikan Anti-Duplikat
          </button>
        {/if}
      </div>
    </div>
  {/if}
</section>
