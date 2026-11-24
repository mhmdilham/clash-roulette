<script lang="ts">
  import { getHeroById, getItemById } from '../data';
  import type { LoadoutState } from '../data/types';
  import UnitIcon from './UnitIcon.svelte';

  interface Props {
    loadout: LoadoutState;
    townHall: number;
    cardRef?: HTMLDivElement | undefined;
  }

  let { loadout, townHall, cardRef = $bindable() }: Props = $props();
</script>

<!-- Offscreen printable card container rendered cleanly for html-to-image PNG export -->
<div class="pointer-events-none fixed top-0 -left-[9999px] z-[-1]" aria-hidden="true">
  <div
    bind:this={cardRef}
    class="w-[680px] rounded-2xl border-2 border-amber-400/70 bg-gradient-to-br from-[#0e101c] via-[#121324] to-[#0a0b12] p-6 text-slate-100"
  >
    <div class="mb-5 flex items-center justify-between border-b border-slate-800 pb-4">
      <div>
        <div class="text-xs font-bold tracking-widest text-amber-400 uppercase">
          Clash of Clans Attack Spin
        </div>
        <h3 class="text-2xl font-black text-white">Loadout Challenge</h3>
      </div>
      <div
        class="rounded-xl border border-amber-400/60 bg-amber-500/15 px-4 py-2 text-lg font-black text-amber-300"
      >
        TH {townHall}
      </div>
    </div>

    {#if loadout.heroes.length > 0}
      <div class="mb-4">
        <div class="mb-2 text-xs font-bold tracking-wider text-amber-300 uppercase">
          Heroes, Equipment & Pets
        </div>
        <div class="grid grid-cols-2 gap-3">
          {#each loadout.heroes as slot (slot.uid)}
            {@const hero = getHeroById(slot.heroId)}
            {#if hero}
              <div class="rounded-xl border border-slate-800 bg-slate-900/90 p-3">
                <div class="mb-2 flex items-center gap-2.5">
                  <UnitIcon item={hero} size={40} class="border-amber-400/60" />
                  <div class="font-bold text-white">{hero.name}</div>
                </div>
                <div class="flex flex-wrap items-center gap-1.5">
                  {#each slot.equipment as eq (eq.uid)}
                    {@const eqItem = getItemById(eq.itemId)}
                    {#if eqItem}
                      <div class="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-2 py-1 text-xs text-slate-200 ring-1 ring-slate-800">
                        <UnitIcon item={eqItem} size={22} />
                        <span>{eqItem.name}</span>
                      </div>
                    {/if}
                  {/each}
                  {#if slot.pet}
                    {@const petItem = getItemById(slot.pet.itemId)}
                    {#if petItem}
                      <div class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-950/60 px-2 py-1 text-xs text-emerald-200 ring-1 ring-emerald-700/50">
                        <UnitIcon item={petItem} size={22} />
                        <span>{petItem.name}</span>
                      </div>
                    {/if}
                  {/if}
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/if}

    {#if loadout.troops.length > 0}
      <div class="mb-3">
        <div class="mb-1.5 text-xs font-bold tracking-wider text-slate-400 uppercase">Troops</div>
        <div class="flex flex-wrap gap-2">
          {#each loadout.troops as entry (entry.uid)}
            {@const item = getItemById(entry.itemId)}
            {#if item}
              <div class="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-100 ring-1 ring-slate-700">
                <UnitIcon {item} size={24} />
                <span>{item.name}</span>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/if}

    {#if loadout.superTroops.length > 0}
      <div class="mb-3">
        <div class="mb-1.5 text-xs font-bold tracking-wider text-fuchsia-300 uppercase">Super Troops</div>
        <div class="flex flex-wrap gap-2">
          {#each loadout.superTroops as entry (entry.uid)}
            {@const item = getItemById(entry.itemId)}
            {#if item}
              <div class="inline-flex items-center gap-1.5 rounded-lg bg-fuchsia-950/40 px-2.5 py-1 text-xs font-semibold text-fuchsia-100 ring-1 ring-fuchsia-700/50">
                <UnitIcon {item} size={24} />
                <span>{item.name}</span>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/if}

    <div class="grid grid-cols-2 gap-3">
      {#if loadout.spells.length > 0}
        <div>
          <div class="mb-1.5 text-xs font-bold tracking-wider text-sky-300 uppercase">Spells</div>
          <div class="flex flex-wrap gap-1.5">
            {#each loadout.spells as entry (entry.uid)}
              {@const item = getItemById(entry.itemId)}
              {#if item}
                <div class="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-100 ring-1 ring-slate-700">
                  <UnitIcon {item} size={22} />
                  <span>{item.name}</span>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      {/if}

      {#if loadout.siegeMachines.length > 0}
        <div>
          <div class="mb-1.5 text-xs font-bold tracking-wider text-rose-300 uppercase">Siege Machine</div>
          <div class="flex flex-wrap gap-1.5">
            {#each loadout.siegeMachines as entry (entry.uid)}
              {@const item = getItemById(entry.itemId)}
              {#if item}
                <div class="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-100 ring-1 ring-slate-700">
                  <UnitIcon {item} size={22} />
                  <span>{item.name}</span>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
