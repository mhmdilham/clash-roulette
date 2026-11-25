<script lang="ts">
  import { untrack } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { RotateCw, X } from 'lucide-svelte';
  import { CATEGORIES } from '../data';
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
  let wheelContainer: HTMLElement | undefined = $state();
  let failedImageIds = new SvelteSet<string>();
  let lastHandledRespinSeq = 0;
  let rafId: number | null = null;
  let bounceTimer: ReturnType<typeof setTimeout> | null = null;

  let items = $derived(spinStore.poolResult.items);
  let sliceCount = $derived(items.length);
  let canSpin = $derived(!spinStore.isSpinning && sliceCount > 0);
  let activeCategoryLabel = $derived(
    CATEGORIES.find((c) => c.id === spinStore.activeCategory)?.label ?? spinStore.activeCategory,
  );

  let spinButtonLabel = $derived.by(() => {
    if (spinStore.isSpinning) return '...';
    if (sliceCount > 0) return 'SPIN';
    const reason = spinStore.poolResult.emptyReason;
    if (reason === 'slot-full') return spinStore.t.spinFull;
    return spinStore.t.spinEmpty;
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
    if (total === 1) return '#1d1b17';
    const palette = ['#161512', '#211f1b', '#1b1915'];
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

<section
  bind:this={wheelContainer}
  class="panel-surface flex flex-1 flex-col items-center p-4 sm:p-5"
>
  <!-- Wheel Stage Top Bar -->
  <div
    class="mb-3 flex w-full items-center justify-between gap-3 border-b border-[var(--border)] pb-3"
  >
    <div class="min-w-0">
      <h2 class="text-sm font-semibold text-[var(--ink)]">{activeCategoryLabel}</h2>
    </div>
    <div class="flex shrink-0 items-center gap-2 font-mono text-xs tabular-nums">
      <span
        class="rounded-md border border-[var(--border)] bg-[var(--surface-inset)] px-2.5 py-1 text-[var(--muted)]"
      >
        <strong class="font-semibold text-[var(--accent)]">{sliceCount}</strong> / {spinStore
          .poolResult.totalAtTh}
        {spinStore.t.unitCountSuffix}
      </span>
    </div>
  </div>

  <!-- Active Re-spin Target Strip -->
  {#if spinStore.replaceTarget}
    <div
      class="mb-3 flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--accent-border)] bg-[var(--accent-tint)] px-3 py-2 text-xs font-medium text-[var(--ink)]"
    >
      <div class="flex min-w-0 items-center gap-2">
        <RotateCw
          class="h-3.5 w-3.5 shrink-0 text-[var(--accent)] {spinStore.isSpinning
            ? 'motion-safe:animate-spin'
            : ''}"
        />
        <span class="truncate">
          {spinStore.t.respinSlotLabel}
          <strong class="font-semibold text-[var(--ink)]">
            {spinStore.replaceTarget.currentItemName}
          </strong>
        </span>
      </div>
      {#if !spinStore.isSpinning}
        <button
          type="button"
          onclick={() => spinStore.cancelReplaceTarget()}
          class="icon-action shrink-0 text-[var(--accent)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
          aria-label={spinStore.t.cancelRespinAria}
        >
          <X class="h-3.5 w-3.5" />
        </button>
      {/if}
    </div>
  {/if}

  <!-- Forged Brass & Obsidian Wheel Turntable -->
  <div class="relative my-auto aspect-square w-full max-w-[468px] py-2 select-none">
    <svg
      viewBox="0 0 500 500"
      class="relative h-full w-full drop-shadow-[0_14px_28px_rgba(0,0,0,0.55)]"
      role="img"
      aria-label={spinStore.t.wheelAria(activeCategoryLabel)}
    >
      <defs>
        <linearGradient id="brass-rim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f2d281" />
          <stop offset="28%" stop-color="#d49b27" />
          <stop offset="56%" stop-color="#875d12" />
          <stop offset="82%" stop-color="#e5b343" />
          <stop offset="100%" stop-color="#9e6f18" />
        </linearGradient>
        <radialGradient id="wheel-vignette" cx="50%" cy="50%" r="50%">
          <stop offset="58%" stop-color="#000000" stop-opacity="0" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0.4" />
        </radialGradient>
        <linearGradient id="pointer-pawl" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e05344" />
          <stop offset="100%" stop-color="#9c251a" />
        </linearGradient>
      </defs>

      <!-- Outer machined dark ring + burnished brass bezel -->
      <circle cx={CX} cy={CY} r={RADIUS + 18} fill="#12110f" stroke="#36322b" stroke-width="1.5" />
      <circle cx={CX} cy={CY} r={RADIUS + 13} fill="url(#brass-rim)" />
      <circle cx={CX} cy={CY} r={RADIUS + 4} fill="#0e0d0b" />

      <!-- Rotating wheel group -->
      <g style:transform="rotate({rotationDeg}deg)" style:transform-origin="{CX}px {CY}px">
        {#if sliceCount === 0}
          <circle cx={CX} cy={CY} r={RADIUS} fill="#151411" stroke="#3a362e" stroke-width="1.5" />
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
                stroke="rgba(229, 169, 40, 0.2)"
                stroke-width={sliceCount > 24 ? '0.8' : '1.1'}
              />

              <!-- Label angled inward from outer icon toward center -->
              <text
                x={CX + textRadius}
                y={CY}
                text-anchor="end"
                dominant-baseline="central"
                fill="#f3f1ea"
                font-size={fontSize}
                font-weight="600"
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
                    font-weight="700"
                  >
                    {theme.initials}
                  </text>
                {/if}
              </g>
            </g>
          {/each}

          <!-- Inner depth vignette + subtle center hub ring -->
          <circle cx={CX} cy={CY} r={RADIUS} fill="url(#wheel-vignette)" pointer-events="none" />
          <circle
            cx={CX}
            cy={CY}
            r="58"
            fill="none"
            stroke="rgba(229, 169, 40, 0.25)"
            stroke-width="1"
            pointer-events="none"
          />
        {/if}

        <!-- Machined brass rim rivets -->
        {#each Array.from({ length: Math.min(24, Math.max(8, sliceCount)) }, (_, i) => i) as pegIdx (pegIdx)}
          {@const pegAngle = (pegIdx * 360) / Math.min(24, Math.max(8, sliceCount))}
          {@const pegPos = polarToCartesian(CX, CY, RADIUS + 8.5, pegAngle)}
          <circle
            cx={pegPos.x}
            cy={pegPos.y}
            r="2.4"
            fill="#faecc6"
            stroke="#6b4a0d"
            stroke-width="0.6"
          />
        {/each}
      </g>

      <!-- Upright non-rotating empty-wheel message -->
      {#if sliceCount === 0}
        <text
          x={CX}
          y={CY - 104}
          text-anchor="middle"
          fill="#f3f1ea"
          font-size="14"
          font-weight="700"
        >
          {spinStore.poolResult.emptyReason === 'slot-full'
            ? spinStore.t.emptyWheelSlotFull
            : spinStore.t.emptyWheelNoUnits}
        </text>
        <text x={CX} y={CY - 82} text-anchor="middle" fill="#9e998d" font-size="11.5">
          {spinStore.t.emptyWheelHint}
        </text>
      {/if}

      <!-- Fixed 3 o'clock mechanical pointer -->
      <g
        transform="translate(464, 250) {pointerBounce ? 'rotate(-10)' : 'rotate(0)'}"
        class="motion-safe:transition-transform motion-safe:duration-75"
      >
        <path
          d="M -27 0 L 18 -14 L 11 0 L 18 14 Z"
          fill="url(#pointer-pawl)"
          stroke="#f2d281"
          stroke-width="2.2"
          stroke-linejoin="round"
        />
        <circle cx="7" cy="0" r="3" fill="#f2d281" />
      </g>
    </svg>

    <!-- Center Forged Brass SPIN Medallion Button -->
    <button
      type="button"
      disabled={!canSpin}
      onclick={startSpinAnimation}
      aria-label={spinStore.t.spinButtonAria}
      class="absolute top-1/2 left-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-[3px] font-mono text-sm font-bold tracking-wider transition-colors sm:h-24 sm:w-24 sm:text-base {canSpin
        ? 'cursor-pointer border-[#fae29c] bg-[linear-gradient(180deg,#f0bc47_0%,#c78b18_100%)] text-[var(--accent-ink)] shadow-[0_6px_18px_rgba(0,0,0,0.55),inset_0_1px_1px_rgba(255,255,255,0.45)] hover:bg-[linear-gradient(180deg,#f6c95e_0%,#d4961f_100%)] motion-safe:transition-transform motion-safe:duration-150 motion-safe:hover:scale-[1.04] motion-safe:active:scale-95'
        : 'cursor-not-allowed border-[var(--border-strong)] bg-[var(--surface-raised)] text-[var(--muted)] shadow-none'}"
    >
      <span>{spinButtonLabel}</span>
    </button>
  </div>
</section>
