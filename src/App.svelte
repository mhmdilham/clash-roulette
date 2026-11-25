<script lang="ts">
  import { Swords, X } from '@lucide/svelte';
  import SpinWheel from './components/SpinWheel.svelte';
  import SettingsPanel from './components/SettingsPanel.svelte';
  import FilterPanel from './components/FilterPanel.svelte';
  import RevealBanner from './components/RevealBanner.svelte';
  import LoadoutPanel from './components/LoadoutPanel.svelte';
  import { spinStore } from './stores/spinStore.svelte';
</script>

<a href="#main-content" class="skip-link">{spinStore.t.skipToMain}</a>

<div class="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
  <!-- Header -->
  <header
    class="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4"
  >
    <div class="flex items-center gap-3">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--accent-border)] bg-[var(--surface-raised)] text-[var(--accent)]"
        aria-hidden="true"
      >
        <Swords class="h-5 w-5" />
      </div>
      <div class="min-w-0">
        <h1 class="text-lg font-bold tracking-tight text-balance text-[var(--ink)] sm:text-xl">
          Clash Roulette
        </h1>
        <p class="text-xs text-[var(--muted)]">{spinStore.t.subtitle}</p>
      </div>
    </div>

    <div class="flex items-center gap-2 font-mono text-xs tabular-nums">
      <span
        class="inline-flex items-center rounded-md border border-[var(--accent-border)] bg-[var(--accent-tint)] px-2.5 py-1 font-semibold text-[var(--accent)]"
      >
        TH {spinStore.townHall}
      </span>
      <span
        class="inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 font-medium text-[var(--ink-secondary)]"
      >
        {spinStore.t.pickedCount(spinStore.totalPickedCount)}
      </span>
      <div
        class="inline-flex rounded-lg border border-[var(--border-strong)] bg-[var(--surface-inset)] p-0.5"
        role="group"
        aria-label={spinStore.t.languageSwitchAria}
      >
        <button
          type="button"
          onclick={() => spinStore.setLocale('id')}
          aria-pressed={spinStore.locale === 'id'}
          class="min-h-7 cursor-pointer rounded-md px-2 py-0.5 font-mono text-xs font-semibold transition-colors {spinStore.locale ===
          'id'
            ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
            : 'text-[var(--muted)] hover:text-[var(--ink)]'}"
        >
          ID
        </button>
        <button
          type="button"
          onclick={() => spinStore.setLocale('en')}
          aria-pressed={spinStore.locale === 'en'}
          class="min-h-7 cursor-pointer rounded-md px-2 py-0.5 font-mono text-xs font-semibold transition-colors {spinStore.locale ===
          'en'
            ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
            : 'text-[var(--muted)] hover:text-[var(--ink)]'}"
        >
          EN
        </button>
      </div>
    </div>
  </header>

  <!-- Toast Notification -->
  {#if spinStore.toastMessage}
    <div
      role="status"
      aria-live="polite"
      class="mb-5 flex items-center justify-between gap-3 rounded-lg border border-l-4 border-[var(--accent-border)] border-l-[var(--accent)] bg-[var(--surface-raised)] px-4 py-2.5 text-sm font-medium text-[var(--ink)]"
    >
      <span>{spinStore.toastMessage}</span>
      <button
        type="button"
        onclick={() => spinStore.dismissToast()}
        class="icon-action shrink-0 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
        aria-label={spinStore.t.closeNotification}
      >
        <X class="h-4 w-4" />
      </button>
    </div>
  {/if}

  <!-- Main Content Landmark -->
  <main id="main-content" class="flex-1 space-y-6">
    <!-- Primary Workspace: Wheel Stage (left) + Control Deck (right) -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
      <div class="flex flex-col gap-4 lg:col-span-6">
        <SpinWheel />
        <RevealBanner />
      </div>

      <div class="flex flex-col gap-4 lg:col-span-6">
        <SettingsPanel />
        <FilterPanel />
      </div>
    </div>

    <!-- Full-width Loadout Summary & Export Controls -->
    <LoadoutPanel />
  </main>

  <!-- Footer -->
  <footer
    class="mt-10 border-t border-[var(--border)] pt-5 text-center text-xs text-[var(--muted)]"
  >
    {spinStore.t.footerDisclaimer}
  </footer>
</div>
