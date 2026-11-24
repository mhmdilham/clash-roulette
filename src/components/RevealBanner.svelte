<script lang="ts">
  import { RotateCw, Sparkles, X } from 'lucide-svelte';
  import { getHeroById } from '../data';
  import { spinStore } from '../stores/spinStore.svelte';
  import UnitIcon from './UnitIcon.svelte';

  let reveal = $derived(spinStore.lastReveal);
</script>

{#if reveal}
  {@const item = reveal.item}
  <div
    class="flex items-center justify-between gap-3 rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-slate-900/90 p-3 shadow-lg"
    role="status"
    aria-live="polite"
  >
    <div class="flex min-w-0 items-center gap-3">
      <UnitIcon {item} size={46} class="border-amber-400/60" />
      <div class="min-w-0">
        <div class="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-amber-300 uppercase">
          <Sparkles class="h-3 w-3" />
          <span>{reveal.replacedItemName ? `Mengganti ${reveal.replacedItemName}` : 'Hasil Spin Terbaru'}</span>
        </div>
        <div class="truncate text-base font-extrabold text-white">{item.name}</div>
        <div class="mt-0.5 flex flex-wrap items-center gap-1">
          {#if item.category === 'troops' || item.category === 'superTroops'}
            {#each item.roles as role}
              <span class="rounded bg-slate-800/90 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                {role}
              </span>
            {/each}
            <span class="rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-sky-300 uppercase">
              {item.movement}
            </span>
          {:else if item.category === 'equipment'}
            <span class="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-purple-200">
              {getHeroById(item.heroId)?.name ?? item.heroId}
            </span>
            <span
              class="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase {item.rarity === 'epic'
                ? 'bg-fuchsia-500/25 text-fuchsia-200'
                : 'bg-sky-500/20 text-sky-200'}"
            >
              {item.rarity}
            </span>
          {/if}
        </div>
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-1.5">
      {#if reveal.slotTarget}
        <button
          type="button"
          disabled={spinStore.isSpinning}
          onclick={() => reveal.slotTarget && spinStore.startSlotRespin(reveal.slotTarget)}
          class="inline-flex items-center gap-1 rounded-lg border border-amber-400/50 bg-slate-900/90 px-2.5 py-1.5 text-xs font-bold text-amber-200 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
          title="Re-spin slot ini"
        >
          <RotateCw class="h-3.5 w-3.5" />
          <span class="hidden sm:inline">Re-spin</span>
        </button>
      {/if}
      <button
        type="button"
        onclick={() => {
          spinStore.lastReveal = null;
        }}
        class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        aria-label="Tutup banner hasil"
      >
        <X class="h-4 w-4" />
      </button>
    </div>
  </div>
{/if}
