<script lang="ts">
  import { RotateCcw, Volume2, VolumeX, Zap, ShieldCheck, CopyX } from 'lucide-svelte';
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

<section
  class="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl backdrop-blur-sm sm:p-5"
>
  <div class="mb-4 flex items-center justify-between gap-2">
    <div>
      <h2 class="text-sm font-bold tracking-wide text-amber-300 uppercase">Pengaturan Spin</h2>
      <p class="text-xs text-slate-400">Pilih Town Hall & kategori roda</p>
    </div>
    <button
      type="button"
      disabled={spinStore.isSpinning}
      onclick={() => spinStore.resetCategory()}
      class="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-amber-400/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      <RotateCcw class="h-3.5 w-3.5" />
      Reset
    </button>
  </div>

  <!-- Town Hall Selector -->
  <div class="mb-4">
    <label for="th-select" class="mb-1.5 block text-xs font-semibold text-slate-300">
      Town Hall
    </label>
    <select
      id="th-select"
      value={spinStore.townHall}
      disabled={spinStore.isSpinning}
      onchange={(e) => spinStore.setTownHall(Number((e.currentTarget as HTMLSelectElement).value))}
      class="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-slate-100 shadow-inner transition-colors focus:border-amber-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    >
      {#each thLevelsDesc as th (th.level)}
        <option value={th.level}>
          Town Hall {th.level}
          {th.level === 19 ? ' (Terbaru)' : ''}
          {th.maxActiveHeroes > 0 ? ` — Maks ${th.maxActiveHeroes} Hero` : ''}
          {th.maxPets > 0 ? `, ${th.maxPets} Pet` : ''}
        </option>
      {/each}
    </select>
  </div>

  <!-- Category Selector Grid -->
  <div class="mb-4">
    <span class="mb-1.5 block text-xs font-semibold text-slate-300">Kategori</span>
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
            class="flex items-center justify-between gap-1.5 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 {active
              ? 'border-amber-400 bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.18)]'
              : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-600 hover:text-white'}"
          >
            <span class="truncate">{cat.label}</span>
            {#if badge}
              <span
                class="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold {full
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : active
                    ? 'bg-amber-400/25 text-amber-200'
                    : 'bg-slate-800 text-slate-400'}"
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
  <div class="space-y-2.5 border-t border-slate-800 pt-3.5">
    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        onclick={() => spinStore.setFastSpin(!spinStore.fastSpin)}
        aria-pressed={spinStore.fastSpin}
        class="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors {spinStore.fastSpin
          ? 'border-purple-400/60 bg-purple-500/20 text-purple-200'
          : 'border-slate-700/80 bg-slate-950/60 text-slate-400 hover:text-slate-200'}"
      >
        <Zap class="h-3.5 w-3.5" />
        Fast Spin
      </button>

      <button
        type="button"
        disabled={spinStore.isSpinning}
        onclick={() => spinStore.toggleRealisticLimits()}
        aria-pressed={spinStore.filters.realisticLimits}
        class="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 {spinStore.filters.realisticLimits
          ? 'border-amber-400/60 bg-amber-500/15 text-amber-200'
          : 'border-slate-700/80 bg-slate-950/60 text-slate-400 hover:text-slate-200'}"
      >
        <ShieldCheck class="h-3.5 w-3.5" />
        Batas Realistis TH
      </button>

      <button
        type="button"
        disabled={spinStore.isSpinning}
        onclick={() => spinStore.toggleAntiDuplicate()}
        aria-pressed={spinStore.filters.antiDuplicate}
        class="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 {spinStore.filters.antiDuplicate
          ? 'border-sky-400/60 bg-sky-500/15 text-sky-200'
          : 'border-slate-700/80 bg-slate-950/60 text-slate-400 hover:text-slate-200'}"
      >
        <CopyX class="h-3.5 w-3.5" />
        Anti-Duplikat
      </button>
    </div>

    <!-- Sound Control -->
    <div class="flex items-center gap-2.5 rounded-xl bg-slate-950/60 px-3 py-2 ring-1 ring-slate-800/80">
      <button
        type="button"
        onclick={() => spinStore.setSoundEnabled(!spinStore.soundEnabled)}
        aria-label={spinStore.soundEnabled ? 'Matikan suara' : 'Nyalakan suara'}
        class="text-slate-300 transition-colors hover:text-amber-300"
      >
        {#if spinStore.soundEnabled && spinStore.soundVolume > 0}
          <Volume2 class="h-4 w-4 text-amber-300" />
        {:else}
          <VolumeX class="h-4 w-4 text-slate-500" />
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
        aria-label="Volume suara spin"
        class="h-1.5 flex-1 cursor-pointer accent-amber-400"
      />
      <span class="w-8 text-right text-[11px] font-medium text-slate-400">
        {spinStore.soundEnabled ? Math.round(spinStore.soundVolume * 100) : 0}%
      </span>
    </div>
  </div>
</section>
