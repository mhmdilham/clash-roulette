<script lang="ts">
  import { untrack } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { RotateCw, X } from 'lucide-svelte';
  import { spinStore } from '../stores/spinStore.svelte';
  import {
    computeTargetRotation,
    describeSlicePath,
    getSliceIndexAtPointer,
    getSliceMidAngle,
    pickRandomIndex,
    polarToCartesian,
  } from '../engine/wheelMath';
  import { spinAudio } from '../utils/audio';
  import { getUnitFallbackTheme } from '../utils/unitTheme';
  import type { SpinItem } from '../data/types';

  const CX = 250;
  const CY = 250;
  const RADIUS = 216;

  let rotationDeg = $state(0);
  let pointerBounce = $state(false);
  let wheelContainer: HTMLDivElement | undefined = $state();
  let failedImageIds = new SvelteSet<string>();
  let lastHandledRespinSeq = 0;
  let rafId: number | null = null;
  let bounceTimer: ReturnType<typeof setTimeout> | null = null;

  let items = $derived(spinStore.poolResult.items);
  let sliceCount = $derived(items.length);
  let canSpin = $derived(!spinStore.isSpinning && sliceCount > 0);

  let spinButtonLabel = $derived.by(() => {
    if (spinStore.isSpinning) return '...';
    if (sliceCount > 0) return 'SPIN!';
    const reason = spinStore.poolResult.emptyReason;
    if (reason === 'slot-full') return 'PENUH';
    return 'KOSONG';
  });

  function easeOutQuart(t: number): number {
    return 1 - Math.pow(1 - t, 4);
  }

  function triggerPointerTick(): void {
    spinAudio.playTick();
    pointerBounce = true;
    if (bounceTimer) clearTimeout(bounceTimer);
    bounceTimer = setTimeout(() => {
      pointerBounce = false;
    }, 65);
  }

  function startSpinAnimation(): void {
    if (!spinStore.beginSpin()) return;

    const snapshotItems: SpinItem[] = [...spinStore.poolResult.items];
    const count = snapshotItems.length;
    if (count === 0) return;

    const targetIndex = pickRandomIndex(count);
    const winningItem = snapshotItems[targetIndex];
    const isFast = spinStore.fastSpin;
    const durationMs = isFast ? 950 : 3700;
    const minSpins = isFast ? 3 : 6;

    const startDeg = rotationDeg;
    const endDeg = computeTargetRotation(startDeg, targetIndex, count, { minSpins });
    const startTime = performance.now();
    let lastSliceIdx = getSliceIndexAtPointer(startDeg, count);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = easeOutQuart(progress);
      const current = startDeg + (endDeg - startDeg) * eased;
      rotationDeg = current;

      if (count > 1) {
        const currentSlice = getSliceIndexAtPointer(current, count);
        if (currentSlice !== lastSliceIdx) {
          lastSliceIdx = currentSlice;
          triggerPointerTick();
        }
      }

      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        rafId = null;
        rotationDeg = endDeg;
        spinStore.completeSpin(winningItem);
      }
    };

    rafId = requestAnimationFrame(step);
  }

  // Trigger animated wheel spin automatically when a Loadout slot Re-spin is requested
  $effect(() => {
    const seq = spinStore.respinRequestSeq;
    if (seq > lastHandledRespinSeq) {
      lastHandledRespinSeq = seq;
      untrack(() => {
        if (wheelContainer && typeof window !== 'undefined' && window.innerWidth < 1024) {
          wheelContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        startSpinAnimation();
      });
    }
  });

  // Cleanup rAF on unmount
  $effect(() => {
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (bounceTimer) clearTimeout(bounceTimer);
    };
  });

  function getSliceFill(index: number, total: number): string {
    if (total === 1) return '#1d1c2b';
    const palette = ['#171722', '#222234', '#1b1a29'];
    return palette[index % (total % 2 === 1 ? 3 : 2)];
  }

  function formatSliceLabel(name: string, count: number): string {
    const maxLen = count > 26 ? 12 : count > 16 ? 14 : 15;
    if (name.length <= maxLen) return name;
    return `${name.slice(0, maxLen - 1)}…`;
  }

  function getLabelFontSize(count: number): number {
    if (count <= 6) return 11.5;
    if (count <= 12) return 10.5;
    if (count <= 20) return 9.5;
    if (count <= 28) return 8.6;
    return 7.8;
  }

  function getIconSize(count: number): number {
    if (count <= 6) return 40;
    if (count <= 12) return 32;
    if (count <= 20) return 26;
    if (count <= 28) return 21;
    return 18;
  }

  function getIconRadius(count: number): number {
    if (count <= 6) return 174;
    if (count <= 12) return 180;
    return 186;
  }
</script>

<div bind:this={wheelContainer} class="flex flex-col items-center gap-3">
  {#if spinStore.replaceTarget}
    <div
      class="flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-500/15 px-3.5 py-1.5 text-xs font-semibold text-amber-200 shadow-sm"
    >
      <RotateCw class="h-3.5 w-3.5 {spinStore.isSpinning ? 'animate-spin' : ''}" />
      <span>Re-spinning: <strong class="text-white">{spinStore.replaceTarget.currentItemName}</strong></span>
      {#if !spinStore.isSpinning}
        <button
          type="button"
          onclick={() => spinStore.cancelReplaceTarget()}
          class="ml-1 rounded-full p-0.5 text-amber-300 transition-colors hover:bg-amber-400/20 hover:text-white"
          aria-label="Batalkan re-spin"
        >
          <X class="h-3.5 w-3.5" />
        </button>
      {/if}
    </div>
  {/if}

  <div class="relative aspect-square w-full max-w-[460px] select-none">
    <!-- Ambient golden halo -->
    <div
      class="pointer-events-none absolute inset-4 rounded-full bg-amber-500/10 blur-2xl"
      aria-hidden="true"
    ></div>

    <svg
      viewBox="0 0 500 500"
      class="relative h-full w-full drop-shadow-[0_18px_38px_rgba(0,0,0,0.65)]"
      role="img"
      aria-label="Roda spin Clash of Clans"
    >
      <defs>
        <linearGradient id="gold-rim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fde68a" />
          <stop offset="28%" stop-color="#eab308" />
          <stop offset="55%" stop-color="#a16207" />
          <stop offset="80%" stop-color="#facc15" />
          <stop offset="100%" stop-color="#ca8a04" />
        </linearGradient>
        <radialGradient id="wheel-vignette" cx="50%" cy="50%" r="50%">
          <stop offset="55%" stop-color="#000000" stop-opacity="0" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0.45" />
        </radialGradient>
        <linearGradient id="pointer-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#a855f7" />
          <stop offset="100%" stop-color="#6b21a8" />
        </linearGradient>
      </defs>

      <!-- Outer metallic gold ring -->
      <circle cx={CX} cy={CY} r={RADIUS + 14} fill="url(#gold-rim)" />
      <circle cx={CX} cy={CY} r={RADIUS + 4} fill="#0c0d14" />

      <!-- Rotating wheel group -->
      <g style:transform="rotate({rotationDeg}deg)" style:transform-origin="{CX}px {CY}px">
        {#if sliceCount === 0}
          <circle cx={CX} cy={CY} r={RADIUS} fill="#141520" stroke="#334155" stroke-width="1.5" />
        {:else}
          {@const step = 360 / sliceCount}
          {@const iconSize = getIconSize(sliceCount)}
          {@const iconRadius = getIconRadius(sliceCount)}
          {@const fontSize = getLabelFontSize(sliceCount)}
          {#each items as item, idx (item.id)}
            {@const startDeg = idx * step}
            {@const endDeg = (idx + 1) * step}
            {@const midDeg = getSliceMidAngle(idx, sliceCount)}
            {@const iconPos = polarToCartesian(CX, CY, iconRadius, midDeg)}
            {@const textRadius = sliceCount === 1 ? 142 : iconRadius - iconSize * 0.58 - 6}
            {@const theme = getUnitFallbackTheme(item)}
            <g>
              <path
                d={describeSlicePath(CX, CY, RADIUS, startDeg, endDeg)}
                fill={getSliceFill(idx, sliceCount)}
                stroke="rgba(251, 191, 36, 0.22)"
                stroke-width={sliceCount > 24 ? '0.8' : '1.2'}
              />

              <!-- Label angled inward from outer icon toward center -->
              <text
                x={CX + textRadius}
                y={CY}
                text-anchor="end"
                dominant-baseline="central"
                fill="#f1f5f9"
                font-size={fontSize}
                font-weight="700"
                transform="rotate({midDeg}, {CX}, {CY})"
              >
                {formatSliceLabel(item.name, sliceCount)}
              </text>

              <!-- Portrait icon near rim -->
              <g transform="translate({iconPos.x}, {iconPos.y}) rotate({midDeg + 90})">
                {#if !failedImageIds.has(item.id)}
                  <image
                    href={item.iconPath}
                    x={-iconSize / 2}
                    y={-iconSize / 2}
                    width={iconSize}
                    height={iconSize}
                    preserveAspectRatio="xMidYMid meet"
                    onerror={() => {
                      failedImageIds.add(item.id);
                    }}
                  />
                {:else}
                  <circle
                    cx="0"
                    cy="0"
                    r={iconSize / 2}
                    fill={theme.bgFrom}
                    stroke={theme.border}
                    stroke-width="1.5"
                  />
                  <text
                    x="0"
                    y="1"
                    text-anchor="middle"
                    dominant-baseline="central"
                    fill={theme.badgeText}
                    font-size={Math.max(8, iconSize * 0.38)}
                    font-weight="800"
                  >
                    {theme.initials}
                  </text>
                {/if}
              </g>
            </g>
          {/each}

          <!-- Subtle inner depth vignette -->
          <circle cx={CX} cy={CY} r={RADIUS} fill="url(#wheel-vignette)" pointer-events="none" />
        {/if}

        <!-- Decorative rim pegs -->
        {#each Array.from({ length: Math.min(24, Math.max(8, sliceCount)) }) as _, pegIdx}
          {@const pegAngle = (pegIdx * 360) / Math.min(24, Math.max(8, sliceCount))}
          {@const pegPos = polarToCartesian(CX, CY, RADIUS + 9, pegAngle)}
          <circle cx={pegPos.x} cy={pegPos.y} r="2.6" fill="#fef3c7" opacity="0.85" />
        {/each}
      </g>

      <!-- Upright non-rotating empty-wheel message -->
      {#if sliceCount === 0}
        <text
          x={CX}
          y={CY - 102}
          text-anchor="middle"
          fill="#e2e8f0"
          font-size="14"
          font-weight="700"
        >
          {spinStore.poolResult.emptyReason === 'slot-full'
            ? 'Slot Kategori Sudah Penuh'
            : 'Tidak Ada Unit di Roda'}
        </text>
        <text x={CX} y={CY - 82} text-anchor="middle" fill="#94a3b8" font-size="11.5">
          Gunakan tombol pemulihan di panel filter
        </text>
      {/if}

      <!-- Fixed 3 o'clock pointer -->
      <g
        transform="translate(462, 250) {pointerBounce ? 'rotate(-10)' : 'rotate(0)'}"
        class="transition-transform duration-75"
      >
        <path
          d="M -26 0 L 18 -15 L 11 0 L 18 15 Z"
          fill="url(#pointer-grad)"
          stroke="#fde047"
          stroke-width="2.5"
          stroke-linejoin="round"
        />
      </g>
    </svg>

    <!-- Center SPIN! Button -->
    <button
      type="button"
      disabled={!canSpin}
      onclick={startSpinAnimation}
      aria-label="Putar roda spin"
      class="group absolute top-1/2 left-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-4 border-amber-400 bg-gradient-to-b from-purple-600 to-purple-900 text-sm font-black tracking-wider text-amber-100 shadow-[0_0_24px_rgba(168,85,247,0.55)] transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300 sm:h-24 sm:w-24 sm:text-base {canSpin
        ? 'cursor-pointer hover:scale-105 hover:from-purple-500 hover:to-purple-800 active:scale-95'
        : 'cursor-not-allowed border-slate-600 from-slate-700 to-slate-900 text-slate-400 shadow-none'}"
    >
      <span>{spinButtonLabel}</span>
    </button>
  </div>

  <!-- Pool info line under wheel -->
  <div class="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
    <span class="rounded-md bg-slate-900/90 px-2.5 py-1 ring-1 ring-slate-800">
      Di roda: <strong class="text-amber-300">{sliceCount}</strong> / {spinStore.poolResult.totalAtTh} unit (TH{spinStore.townHall})
    </span>
    {#if spinStore.fastSpin}
      <span class="rounded-md bg-purple-500/15 px-2 py-1 text-purple-300 ring-1 ring-purple-500/30">
        ⚡ Fast Spin Aktif
      </span>
    {/if}
  </div>
</div>
