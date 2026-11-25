<script lang="ts">
  import {
    Check,
    ChevronDown,
    CopyX,
    RotateCcw,
    ShieldCheck,
    Volume2,
    VolumeX,
    Zap,
  } from 'lucide-svelte';
  import { CATEGORIES, TOWN_HALLS } from '../data';
  import type { CategoryId } from '../data/types';
  import { getSlotUsage } from '../engine/poolFilter';
  import { spinStore } from '../stores/spinStore.svelte';

  const thLevelsDesc = [...TOWN_HALLS].reverse();

  function categoryBadge(catId: CategoryId): string {
    const usage = getSlotUsage(
      catId,
      spinStore.townHall,
      spinStore.loadout,
      spinStore.filters.realisticLimits,
    );
    if (usage.max !== null) {
      return `${usage.used}/${usage.max}`;
    }
    return usage.used > 0 ? `${usage.used}` : '';
  }

  function isCategoryFull(catId: CategoryId): boolean {
    if (!spinStore.filters.realisticLimits || catId === 'equipment') return false;
    const usage = getSlotUsage(catId, spinStore.townHall, spinStore.loadout, true);
    return usage.max !== null && usage.used >= usage.max;
  }
</script>

<section class="panel-surface p-4 sm:p-5">
  <div class="mb-4 flex items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
    <h2 class="text-sm font-semibold text-[var(--ink)]">{spinStore.t.settingsTitle}</h2>
    <button
      type="button"
      disabled={spinStore.isSpinning}
      onclick={() => spinStore.resetCategory()}
      class="btn-tactile inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-raised)] px-2.5 py-1 text-xs font-medium text-[var(--ink-secondary)] hover:border-[var(--accent-border)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-45"
    >
      <RotateCcw class="h-3.5 w-3.5" />
      {spinStore.t.reset}
    </button>
  </div>

  <!-- Town Hall Selector -->
  <div class="mb-4">
    <label for="th-select" class="mb-1.5 block text-xs font-medium text-[var(--ink-secondary)]">
      Town Hall
    </label>
    <div class="relative">
      <select
        id="th-select"
        value={spinStore.townHall}
        disabled={spinStore.isSpinning}
        onchange={(e) =>
          spinStore.setTownHall(Number((e.currentTarget as HTMLSelectElement).value))}
        class="min-h-11 w-full cursor-pointer appearance-none rounded-lg border border-[var(--border-strong)] bg-[var(--surface-inset)] py-2.5 pr-10 pl-3.5 text-sm font-semibold text-[var(--ink)] transition-colors hover:border-[var(--accent-border)] focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-45"
      >
        {#each thLevelsDesc as th (th.level)}
          <option value={th.level}>Town Hall {th.level}</option>
        {/each}
      </select>
      <ChevronDown
        class="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
        aria-hidden="true"
      />
    </div>
  </div>

  <!-- Category Selector Grid -->
  <div class="mb-4">
    <span class="mb-1.5 block text-xs font-medium text-[var(--ink-secondary)]">
      {spinStore.t.categoryLabel}
    </span>
    <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
      {#each CATEGORIES as cat (cat.id)}
        {@const available = spinStore.availableCategories.includes(cat.id)}
        {#if available}
          {@const active = spinStore.activeCategory === cat.id}
          {@const badge = categoryBadge(cat.id)}
          {@const full = isCategoryFull(cat.id)}
          <button
            type="button"
            disabled={spinStore.isSpinning}
            onclick={() => spinStore.setCategory(cat.id)}
            aria-pressed={active}
            class="btn-tactile flex min-h-10 cursor-pointer items-center justify-between gap-1.5 rounded-lg border px-3 py-2 text-left text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-45 {active
              ? 'border-[var(--accent)] bg-[var(--accent-tint)] text-[var(--ink)]'
              : 'border-[var(--border)] bg-[var(--surface-inset)] text-[var(--ink-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-raised)] hover:text-[var(--ink)]'}"
          >
            <span class="truncate">{cat.label}</span>
            {#if badge}
              <span
                class="shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums {full
                  ? 'bg-[var(--positive-tint)] text-[var(--positive)]'
                  : active
                    ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                    : 'bg-[var(--surface-raised)] text-[var(--muted)]'}"
              >
                {badge}
              </span>
            {/if}
          </button>
        {/if}
      {/each}
    </div>
  </div>

  <!-- Quick Behavior Toggles -->
  <div class="space-y-3 border-t border-[var(--border)] pt-3.5">
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <button
        type="button"
        onclick={() => spinStore.setFastSpin(!spinStore.fastSpin)}
        aria-pressed={spinStore.fastSpin}
        class="btn-tactile flex min-h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium {spinStore.fastSpin
          ? 'border-[var(--accent-border)] bg-[var(--accent-tint)] text-[var(--ink)]'
          : 'border-[var(--border)] bg-[var(--surface-inset)] text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--ink-secondary)]'}"
      >
        <Zap class="h-3.5 w-3.5 shrink-0 {spinStore.fastSpin ? 'text-[var(--accent)]' : ''}" />
        <span class="truncate">Fast Spin</span>
        {#if spinStore.fastSpin}
          <Check class="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
        {/if}
      </button>

      <button
        type="button"
        disabled={spinStore.isSpinning}
        onclick={() => spinStore.toggleRealisticLimits()}
        aria-pressed={spinStore.filters.realisticLimits}
        class="btn-tactile flex min-h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-45 {spinStore
          .filters.realisticLimits
          ? 'border-[var(--accent-border)] bg-[var(--accent-tint)] text-[var(--ink)]'
          : 'border-[var(--border)] bg-[var(--surface-inset)] text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--ink-secondary)]'}"
      >
        <ShieldCheck
          class="h-3.5 w-3.5 shrink-0 {spinStore.filters.realisticLimits
            ? 'text-[var(--accent)]'
            : ''}"
        />
        <span class="truncate">{spinStore.t.thLimits}</span>
        {#if spinStore.filters.realisticLimits}
          <Check class="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
        {/if}
      </button>

      <button
        type="button"
        disabled={spinStore.isSpinning}
        onclick={() => spinStore.toggleAntiDuplicate()}
        aria-pressed={spinStore.filters.antiDuplicate}
        class="btn-tactile flex min-h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-45 {spinStore
          .filters.antiDuplicate
          ? 'border-[var(--accent-border)] bg-[var(--accent-tint)] text-[var(--ink)]'
          : 'border-[var(--border)] bg-[var(--surface-inset)] text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--ink-secondary)]'}"
      >
        <CopyX
          class="h-3.5 w-3.5 shrink-0 {spinStore.filters.antiDuplicate
            ? 'text-[var(--accent)]'
            : ''}"
        />
        <span class="truncate">{spinStore.t.antiDuplicate}</span>
        {#if spinStore.filters.antiDuplicate}
          <Check class="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
        {/if}
      </button>
    </div>

    <!-- Sound Control -->
    <div
      class="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-inset)] px-3 py-1.5"
    >
      <button
        type="button"
        onclick={() => spinStore.setSoundEnabled(!spinStore.soundEnabled)}
        aria-label={spinStore.soundEnabled
          ? spinStore.t.muteSoundAria
          : spinStore.t.unmuteSoundAria}
        class="icon-action cursor-pointer text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--accent)]"
      >
        {#if spinStore.soundEnabled && spinStore.soundVolume > 0}
          <Volume2 class="h-4 w-4 text-[var(--accent)]" />
        {:else}
          <VolumeX class="h-4 w-4 text-[var(--muted)]" />
        {/if}
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={spinStore.soundEnabled ? spinStore.soundVolume : 0}
        oninput={(e) => {
          const v = Number((e.currentTarget as HTMLInputElement).value);
          spinStore.setSoundVolume(v);
          if (v > 0 && !spinStore.soundEnabled) spinStore.setSoundEnabled(true);
        }}
        aria-label={spinStore.t.volumeAria}
        class="volume-range flex-1"
      />
      <span class="w-10 text-right font-mono text-xs font-medium text-[var(--muted)] tabular-nums">
        {spinStore.soundEnabled ? Math.round(spinStore.soundVolume * 100) : 0}%
      </span>
    </div>
  </div>
</section>
