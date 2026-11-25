<script lang="ts">
  import { AlertTriangle, ArrowRight, Check, Filter, Link2, RotateCcw } from '@lucide/svelte';
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
    const names: string[] = [];
    for (const eq of spinStore.loadout.unpairedEquipment) {
      if (!chosen.has(eq.heroId)) {
        const heroName = getHeroById(eq.heroId)?.name ?? eq.heroId;
        if (!names.includes(heroName)) {
          names.push(heroName);
        }
      }
    }
    return names;
  });

  let movementOptions = $derived<{ value: MovementFilter; label: string }[]>([
    { value: 'all', label: spinStore.t.movementAll },
    { value: 'ground', label: 'Ground' },
    { value: 'air', label: 'Air' },
  ]);
</script>

<section class="panel-surface p-4 sm:p-5">
  <div class="mb-3.5 flex items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
    <div class="flex items-center gap-2">
      <Filter class="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
      <h2 class="text-sm font-semibold text-[var(--ink)]">{spinStore.t.filterTitle}</h2>
    </div>
    {#if (cat === 'troops' || cat === 'superTroops') && hasTroopFilters}
      <button
        type="button"
        disabled={spinStore.isSpinning}
        onclick={() => spinStore.resetTroopFilters()}
        class="btn-tactile inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-raised)] px-2.5 py-1 text-xs font-medium text-[var(--ink-secondary)] hover:border-[var(--accent-border)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-45"
      >
        <RotateCcw class="h-3 w-3" />
        {spinStore.t.resetFilter}
      </button>
    {/if}
  </div>

  <!-- 1. Troops & Super Troops Role Filter -->
  {#if cat === 'troops' || cat === 'superTroops'}
    <div class="space-y-3.5">
      <div>
        <div class="mb-2 flex items-center justify-between">
          <span class="text-xs font-medium text-[var(--ink-secondary)]">
            {spinStore.t.unitRoles}
          </span>
          {#if spinStore.filters.roles.length > 0}
            <span class="font-mono text-xs font-medium text-[var(--accent)] tabular-nums">
              {spinStore.t.activeRolesCount(spinStore.filters.roles.length)}
            </span>
          {/if}
        </div>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {#each ALL_TROOP_ROLES as role (role)}
            {@const active = spinStore.filters.roles.includes(role)}
            <button
              type="button"
              disabled={spinStore.isSpinning}
              onclick={() => spinStore.toggleRole(role)}
              aria-pressed={active}
              class="btn-tactile flex min-h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-45 {active
                ? 'border-[var(--accent)] bg-[var(--accent-tint)] text-[var(--ink)]'
                : 'border-[var(--border)] bg-[var(--surface-inset)] text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--ink-secondary)]'}"
            >
              {#if active}
                <Check class="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
              {/if}
              <span class="truncate">{role}</span>
            </button>
          {/each}
        </div>
      </div>

      <div
        class="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-3"
      >
        <!-- OR / AND Match Mode -->
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium text-[var(--muted)]">{spinStore.t.matchLabel}</span>
          <div
            class="inline-flex rounded-lg border border-[var(--border-strong)] bg-[var(--surface-inset)] p-0.5"
          >
            <button
              type="button"
              disabled={spinStore.isSpinning}
              onclick={() => spinStore.setMatchMode('OR')}
              aria-pressed={spinStore.filters.matchMode === 'OR'}
              class="min-h-7 cursor-pointer rounded-md px-2.5 py-1 font-mono text-xs font-semibold transition-colors disabled:opacity-45 {spinStore
                .filters.matchMode === 'OR'
                ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'}"
            >
              OR
            </button>
            <button
              type="button"
              disabled={spinStore.isSpinning}
              onclick={() => spinStore.setMatchMode('AND')}
              aria-pressed={spinStore.filters.matchMode === 'AND'}
              class="min-h-7 cursor-pointer rounded-md px-2.5 py-1 font-mono text-xs font-semibold transition-colors disabled:opacity-45 {spinStore
                .filters.matchMode === 'AND'
                ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'}"
            >
              AND
            </button>
          </div>
        </div>

        <!-- Movement Filter -->
        <div
          class="inline-flex rounded-lg border border-[var(--border-strong)] bg-[var(--surface-inset)] p-0.5"
        >
          {#each movementOptions as opt (opt.value)}
            <button
              type="button"
              disabled={spinStore.isSpinning}
              onclick={() => spinStore.setMovement(opt.value)}
              aria-pressed={spinStore.filters.movement === opt.value}
              class="min-h-7 cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-45 {spinStore
                .filters.movement === opt.value
                ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'}"
            >
              {opt.label}
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!-- 2. Bidirectional Hero <-> Equipment Relevance Filter -->
  {:else if cat === 'heroes' || cat === 'equipment'}
    <div
      class="flex items-start justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface-inset)] p-3.5"
    >
      <div class="space-y-1">
        <div class="flex items-center gap-1.5 text-xs font-semibold text-[var(--ink)]">
          <Link2 class="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
          <span>{spinStore.t.relevantOnly}</span>
        </div>
        <p class="text-xs leading-relaxed text-[var(--muted)]">
          {#if cat === 'equipment'}
            {#if chosenHeroNames.length > 0}
              {#if pool.relevanceEffective}
                {spinStore.t.relevantEquipActivePrefix}
                <strong class="font-semibold text-[var(--ink)]">
                  {chosenHeroNames.join(', ')}
                </strong>.
              {:else}
                {spinStore.t.relevantEquipAll}
              {/if}
            {:else}
              {spinStore.t.relevantEquipAutoHint}
            {/if}
          {:else}
            {#if unpairedEquipHeroNames.length > 0}
              {#if pool.relevanceEffective}
                {spinStore.t.relevantHeroActivePrefix}
                <strong class="font-semibold text-[var(--ink)]">
                  {unpairedEquipHeroNames.join(', ')}
                </strong>.
              {:else}
                {spinStore.t.relevantHeroAll}
              {/if}
            {:else}
              {spinStore.t.relevantHeroAutoHint}
            {/if}
          {/if}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-label={spinStore.t.toggleRelevanceAria}
        aria-checked={pool.relevanceEffective}
        disabled={spinStore.isSpinning ||
          (cat === 'equipment'
            ? chosenHeroNames.length === 0
            : unpairedEquipHeroNames.length === 0)}
        onclick={() => spinStore.toggleRelevance(cat)}
        class="relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40 {pool.relevanceEffective
          ? 'border-[var(--accent)] bg-[var(--accent)]'
          : 'border-[var(--border-strong)] bg-[var(--surface-raised)]'}"
      >
        <span
          data-checked={pool.relevanceEffective}
          class="switch-knob inline-block h-4 w-4 rounded-full {pool.relevanceEffective
            ? 'bg-[var(--accent-ink)]'
            : 'bg-[var(--ink-secondary)]'}"
        ></span>
      </button>
    </div>

    <!-- 3. Siege Machines CC Donation Toggle -->
  {:else if cat === 'siegeMachines'}
    <div
      class="flex items-start justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface-inset)] p-3.5"
    >
      <div class="space-y-1">
        <div class="text-xs font-semibold text-[var(--ink)]">{spinStore.t.ccDonationTitle}</div>
        <p class="text-xs leading-relaxed text-[var(--muted)]">
          {#if spinStore.filters.includeCcSiege}
            {spinStore.t.ccDonationOnDesc}
          {:else}
            {spinStore.t.ccDonationOffDesc}
          {/if}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-label={spinStore.t.toggleCcSiegeAria}
        aria-checked={spinStore.filters.includeCcSiege}
        disabled={spinStore.isSpinning}
        onclick={() => spinStore.toggleIncludeCcSiege()}
        class="relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-45 {spinStore
          .filters.includeCcSiege
          ? 'border-[var(--accent)] bg-[var(--accent)]'
          : 'border-[var(--border-strong)] bg-[var(--surface-raised)]'}"
      >
        <span
          data-checked={spinStore.filters.includeCcSiege}
          class="switch-knob inline-block h-4 w-4 rounded-full {spinStore.filters.includeCcSiege
            ? 'bg-[var(--accent-ink)]'
            : 'bg-[var(--ink-secondary)]'}"
        ></span>
      </button>
    </div>

    <!-- 4. Spells & Pets Info -->
  {:else}
    <p class="text-xs leading-relaxed text-[var(--muted)]">
      {#if cat === 'pets'}
        {spinStore.t.petsInfo}
      {:else}
        {spinStore.t.spellsInfo}
      {/if}
    </p>
  {/if}

  <!-- Contextual Empty Pool Recovery Banner -->
  {#if pool.emptyReason}
    <div
      class="mt-3.5 rounded-lg border border-l-4 border-[var(--accent-border)] border-l-[var(--accent)] bg-[var(--accent-tint)] p-3.5 text-xs text-[var(--ink)]"
    >
      <div class="mb-2.5 flex items-start gap-2">
        <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
        <div>
          {#if pool.emptyReason === 'no-role-match'}
            <p class="font-semibold">{spinStore.t.emptyNoRoleMatch}</p>
          {:else if pool.emptyReason === 'all-heroes-equipped'}
            <p class="font-semibold">{spinStore.t.emptyAllHeroesEquipped}</p>
          {:else if pool.emptyReason === 'no-relevant-heroes'}
            <p class="font-semibold">{spinStore.t.emptyNoRelevantHeroes}</p>
          {:else if pool.emptyReason === 'slot-full'}
            <p class="font-semibold">
              {spinStore.t.emptySlotFull(
                pool.slotUsage.used,
                pool.slotUsage.max,
                spinStore.townHall,
              )}
            </p>
          {:else if pool.emptyReason === 'all-picked'}
            <p class="font-semibold">{spinStore.t.emptyAllPicked}</p>
          {:else}
            <p class="font-semibold">{spinStore.t.emptyUnavailable}</p>
          {/if}
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        {#if pool.emptyReason === 'no-role-match'}
          <button
            type="button"
            onclick={() => spinStore.resetTroopFilters()}
            class="btn-tactile min-h-8 cursor-pointer rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-ink)] hover:bg-[var(--accent-hover)]"
          >
            {spinStore.t.actionResetRoleFilter}
          </button>
        {:else if pool.emptyReason === 'all-heroes-equipped'}
          {#if spinStore.availableCategories.includes('heroes')}
            <button
              type="button"
              onclick={() => spinStore.setCategory('heroes')}
              class="btn-tactile inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-ink)] hover:bg-[var(--accent-hover)]"
            >
              {spinStore.t.actionContinueSpinHero}
              <ArrowRight class="h-3.5 w-3.5" />
            </button>
          {/if}
          <button
            type="button"
            onclick={() => spinStore.toggleRelevance('equipment', false)}
            class="btn-tactile min-h-8 cursor-pointer rounded-lg border border-[var(--border-strong)] bg-[var(--surface-raised)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] hover:border-[var(--accent-border)]"
          >
            {spinStore.t.actionDisableRelevance}
          </button>
        {:else if pool.emptyReason === 'no-relevant-heroes'}
          <button
            type="button"
            onclick={() => spinStore.toggleRelevance('heroes', false)}
            class="btn-tactile min-h-8 cursor-pointer rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-ink)] hover:bg-[var(--accent-hover)]"
          >
            {spinStore.t.actionDisableRelevanceFillHeroes}
          </button>
        {:else if pool.emptyReason === 'slot-full'}
          <button
            type="button"
            onclick={() => spinStore.toggleRealisticLimits()}
            class="btn-tactile min-h-8 cursor-pointer rounded-lg border border-[var(--border-strong)] bg-[var(--surface-raised)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] hover:border-[var(--accent-border)]"
          >
            {spinStore.t.actionDisableThLimits}
          </button>
        {:else if pool.emptyReason === 'all-picked' && (cat === 'troops' || cat === 'spells')}
          <button
            type="button"
            onclick={() => spinStore.toggleAntiDuplicate()}
            class="btn-tactile min-h-8 cursor-pointer rounded-lg border border-[var(--border-strong)] bg-[var(--surface-raised)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] hover:border-[var(--accent-border)]"
          >
            {spinStore.t.actionDisableAntiDuplicate}
          </button>
        {/if}
      </div>
    </div>
  {/if}
</section>
