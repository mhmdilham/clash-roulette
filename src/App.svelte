<script lang="ts">
  import { Swords, X } from 'lucide-svelte';
  import SpinWheel from './components/SpinWheel.svelte';
  import SettingsPanel from './components/SettingsPanel.svelte';
  import FilterPanel from './components/FilterPanel.svelte';
  import RevealBanner from './components/RevealBanner.svelte';
  import LoadoutPanel from './components/LoadoutPanel.svelte';
  import { spinStore } from './stores/spinStore.svelte';
</script>

<div class="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
  <!-- Header -->
  <header class="mb-6 flex items-center justify-between gap-3">
    <div class="flex items-center gap-3">
      <div
        class="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/50 bg-gradient-to-br from-amber-500/25 to-purple-600/30 shadow-lg"
      >
        <Swords class="h-5 w-5 text-amber-300" />
      </div>
      <h1 class="text-xl font-black tracking-tight text-white sm:text-2xl">
        Clash of Clans <span class="bg-gradient-to-r from-amber-300 to-purple-400 bg-clip-text text-transparent">Attack Spin</span>
      </h1>
    </div>
  </header>

  <!-- Toast Notification -->
  {#if spinStore.toastMessage}
    <div
      role="status"
      aria-live="polite"
      class="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-400/40 bg-amber-500/15 px-4 py-2.5 text-xs font-medium text-amber-100 shadow-lg"
    >
      <span>{spinStore.toastMessage}</span>
      <button
        type="button"
        onclick={() => spinStore.dismissToast()}
        class="rounded-md p-1 text-amber-200 hover:bg-amber-400/20 hover:text-white"
        aria-label="Tutup notifikasi"
      >
        <X class="h-3.5 w-3.5" />
      </button>
    </div>
  {/if}

  <!-- Main Workspace: Wheel (left) + Settings & Contextual Filters (right) -->
  <main class="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
    <div class="flex flex-col gap-4 lg:col-span-6 xl:col-span-6">
      <SpinWheel />
      <RevealBanner />
    </div>

    <div class="flex flex-col gap-4 lg:col-span-6 xl:col-span-6">
      <SettingsPanel />
      <FilterPanel />
    </div>
  </main>

  <!-- Full-width Loadout Summary & Share Controls -->
  <div class="mt-6">
    <LoadoutPanel />
  </div>

  <!-- Footer -->
  <footer class="mt-auto pt-8 text-center text-[11px] text-slate-500">
    Konten ini tidak berafiliasi dengan, didukung, disponsori, atau disetujui secara khusus oleh Supercell.
  </footer>
</div>
