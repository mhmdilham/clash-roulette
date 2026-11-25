<script lang="ts">
  import { CheckCircle2, RotateCw, X } from '@lucide/svelte';
  import { getHeroById } from '../data';
  import { spinStore } from '../stores/spinStore.svelte';
  import UnitIcon from './UnitIcon.svelte';

  let reveal = $derived(spinStore.lastReveal);
</script>

{#if reveal}
  {@const item = reveal.item}
  <div
    class="panel-surface flex items-center justify-between gap-3 border-l-4 border-l-[var(--accent)] bg-[var(--surface-raised)] p-3.5"
    role="status"
    aria-live="polite"
  >
    <div class="flex min-w-0 items-center gap-3">
      <UnitIcon {item} size={46} class="border-[var(--accent-border)]" />
      <div class="min-w-0">
        <div class="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)]">
          <CheckCircle2 class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span class="truncate">
            {reveal.replacedItemName
              ? spinStore.t.replacingItem(reveal.replacedItemName)
              : spinStore.t.lastSpinResult}
          </span>
        </div>
        <div class="truncate text-base font-bold text-[var(--ink)]">{item.name}</div>
        <div class="mt-1 flex flex-wrap items-center gap-1.5">
          {#if item.category === 'troops' || item.category === 'superTroops'}
            {#each item.roles as role (role)}
              <span
                class="rounded-md border border-[var(--border)] bg-[var(--surface-inset)] px-2 py-0.5 text-[11px] font-medium text-[var(--ink-secondary)]"
              >
                {role}
              </span>
            {/each}
            <span
              class="rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-0.5 font-mono text-[11px] font-medium text-[var(--muted)] capitalize"
            >
              {item.movement}
            </span>
          {:else if item.category === 'equipment'}
            <span
              class="rounded-md border border-[var(--border)] bg-[var(--surface-inset)] px-2 py-0.5 text-[11px] font-medium text-[var(--ink-secondary)]"
            >
              {getHeroById(item.heroId)?.name ?? item.heroId}
            </span>
            <span
              class="rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold capitalize {item.rarity ===
              'epic'
                ? 'border-[var(--accent-border)] bg-[var(--accent-tint)] text-[var(--accent)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]'}"
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
          class="btn-tactile inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--accent-border)] bg-[var(--surface-inset)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--accent-tint)] disabled:cursor-not-allowed disabled:opacity-45"
          title={spinStore.t.respinThisSlot}
        >
          <RotateCw class="h-3.5 w-3.5 text-[var(--accent)]" />
          <span class="hidden sm:inline">Re-spin</span>
        </button>
      {/if}
      <button
        type="button"
        onclick={() => {
          spinStore.lastReveal = null;
        }}
        class="icon-action cursor-pointer text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
        aria-label={spinStore.t.closeResultBannerAria}
      >
        <X class="h-4 w-4" />
      </button>
    </div>
  </div>
{/if}
