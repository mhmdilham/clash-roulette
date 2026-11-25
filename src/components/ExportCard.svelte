<script lang="ts">
  import { getHeroById, getItemById } from '../data';
  import type { LoadoutState, SuperTroopItem, TroopItem } from '../data/types';
  import { getPrimaryDisplayRole } from '../engine/poolFilter';
  import { spinStore } from '../stores/spinStore.svelte';
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
    class="w-[720px] rounded-xl border border-[#47433a] bg-[#12110f] p-6 text-[#f3f1ea]"
  >
    <div class="mb-5 flex items-center justify-between border-b border-[#2c2924] pb-4">
      <div>
        <div class="font-mono text-xs font-semibold text-[#e5a928]">
          Clash Roulette — Clash of Clans Loadout Spinner
        </div>
        <h3 class="mt-0.5 text-2xl font-bold tracking-tight text-[#f3f1ea]">Loadout Challenge</h3>
      </div>
      <div
        class="rounded-lg border border-[#e5a928]/60 bg-[#e5a928]/15 px-4 py-2 font-mono text-lg font-bold text-[#e5a928] tabular-nums"
      >
        TH {townHall}
      </div>
    </div>

    {#if loadout.heroes.length > 0}
      <div class="mb-5">
        <div class="mb-2 text-xs font-semibold text-[#e5a928]">Heroes, Equipment & Pets</div>
        <div class="grid grid-cols-2 gap-3">
          {#each loadout.heroes as slot (slot.uid)}
            {@const hero = getHeroById(slot.heroId)}
            {#if hero}
              <div class="rounded-lg border border-[#2c2924] bg-[#181714] p-3">
                <div class="mb-2.5 flex items-center gap-2.5">
                  <UnitIcon item={hero} size={40} class="border-[#e5a928]/50" />
                  <div class="font-bold text-[#f3f1ea]">{hero.name}</div>
                </div>
                <div class="space-y-1.5">
                  {#if slot.equipment.length > 0}
                    <div class="grid grid-cols-2 gap-1.5">
                      {#each slot.equipment as eq (eq.uid)}
                        {@const eqItem = getItemById(eq.itemId)}
                        {#if eqItem}
                          <div
                            class="flex min-w-0 items-center gap-1.5 rounded-md border border-[#2c2924] bg-[#11100e] px-2 py-1 text-xs text-[#cbc6ba]"
                          >
                            <UnitIcon item={eqItem} size={20} />
                            <span class="truncate">{eqItem.name}</span>
                          </div>
                        {/if}
                      {/each}
                    </div>
                  {/if}
                  {#if slot.pet}
                    {@const petItem = getItemById(slot.pet.itemId)}
                    {#if petItem}
                      <div
                        class="flex items-center gap-1.5 rounded-md border border-[#38b87c]/40 bg-[#38b87c]/10 px-2 py-1 text-xs text-[#d6f5e6]"
                      >
                        <UnitIcon item={petItem} size={20} />
                        <span class="truncate font-semibold">{petItem.name}</span>
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

    {#if loadout.unpairedEquipment.length > 0}
      <div class="mb-4">
        <div class="mb-1.5 text-xs font-semibold text-[#cbc6ba]">
          {spinStore.t.reserveEquipment}
        </div>
        <div class="grid grid-cols-3 gap-2">
          {#each loadout.unpairedEquipment as eq (eq.uid)}
            {@const eqItem = getItemById(eq.itemId)}
            {#if eqItem}
              <div
                class="flex min-w-0 items-center gap-1.5 rounded-md border border-[#2c2924] bg-[#181714] px-2.5 py-1.5 text-xs font-semibold text-[#f3f1ea]"
              >
                <UnitIcon item={eqItem} size={22} />
                <span class="truncate">{eqItem.name}</span>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/if}

    {#if loadout.unpairedPets.length > 0}
      <div class="mb-4">
        <div class="mb-1.5 text-xs font-semibold text-[#38b87c]">{spinStore.t.reservePets}</div>
        <div class="grid grid-cols-3 gap-2">
          {#each loadout.unpairedPets as pet (pet.uid)}
            {@const petItem = getItemById(pet.itemId)}
            {#if petItem}
              <div
                class="flex min-w-0 items-center gap-1.5 rounded-md border border-[#38b87c]/40 bg-[#38b87c]/10 px-2.5 py-1.5 text-xs font-semibold text-[#d6f5e6]"
              >
                <UnitIcon item={petItem} size={22} />
                <span class="truncate">{petItem.name}</span>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/if}

    {#if loadout.troops.length > 0}
      <div class="mb-4">
        <div class="mb-2 text-xs font-semibold text-[#cbc6ba]">Troops</div>
        <div class="grid grid-cols-3 gap-2">
          {#each loadout.troops as entry (entry.uid)}
            {@const item = getItemById(entry.itemId) as TroopItem | undefined}
            {#if item}
              <div
                class="flex min-w-0 items-center gap-2 rounded-md border border-[#2c2924] bg-[#181714] px-2.5 py-1.5"
              >
                <UnitIcon {item} size={26} />
                <div class="min-w-0 leading-tight">
                  <div class="truncate text-xs font-bold text-[#f3f1ea]">{item.name}</div>
                  <div class="text-[10px] text-[#e5a928]">{getPrimaryDisplayRole(item.roles)}</div>
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/if}

    {#if loadout.superTroops.length > 0 || loadout.spells.length > 0 || loadout.siegeMachines.length > 0}
      <div class="grid grid-cols-3 gap-3">
        {#if loadout.superTroops.length > 0}
          <div>
            <div class="mb-1.5 text-xs font-semibold text-[#cbc6ba]">Super Troops</div>
            <div class="grid grid-cols-1 gap-1.5">
              {#each loadout.superTroops as entry (entry.uid)}
                {@const item = getItemById(entry.itemId) as SuperTroopItem | undefined}
                {#if item}
                  <div
                    class="flex min-w-0 items-center gap-2 rounded-md border border-[#2c2924] bg-[#181714] px-2.5 py-1.5 text-xs font-semibold text-[#f3f1ea]"
                  >
                    <UnitIcon {item} size={22} />
                    <span class="truncate">{item.name}</span>
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        {/if}

        {#if loadout.spells.length > 0}
          <div>
            <div class="mb-1.5 text-xs font-semibold text-[#cbc6ba]">Spells</div>
            <div class="grid grid-cols-1 gap-1.5">
              {#each loadout.spells as entry (entry.uid)}
                {@const item = getItemById(entry.itemId)}
                {#if item}
                  <div
                    class="flex min-w-0 items-center gap-2 rounded-md border border-[#2c2924] bg-[#181714] px-2.5 py-1.5 text-xs font-semibold text-[#f3f1ea]"
                  >
                    <UnitIcon {item} size={22} />
                    <span class="truncate">{item.name}</span>
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        {/if}

        {#if loadout.siegeMachines.length > 0}
          <div>
            <div class="mb-1.5 text-xs font-semibold text-[#cbc6ba]">Siege Machine</div>
            <div class="grid grid-cols-1 gap-1.5">
              {#each loadout.siegeMachines as entry (entry.uid)}
                {@const item = getItemById(entry.itemId)}
                {#if item}
                  <div
                    class="flex min-w-0 items-center gap-2 rounded-md border border-[#2c2924] bg-[#181714] px-2.5 py-1.5 text-xs font-semibold text-[#f3f1ea]"
                  >
                    <UnitIcon {item} size={22} />
                    <span class="truncate">{item.name}</span>
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
