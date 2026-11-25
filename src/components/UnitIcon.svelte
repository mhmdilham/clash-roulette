<script lang="ts">
  import type { SpinItem } from '../data/types';
  import { getUnitFallbackTheme } from '../utils/unitTheme';

  interface Props {
    item: SpinItem;
    size?: number;
    class?: string;
  }

  let { item, size = 40, class: className = '' }: Props = $props();
  let imgFailed = $state(false);

  $effect(() => {
    void item.id;
    imgFailed = false;
  });

  let theme = $derived(getUnitFallbackTheme(item));
</script>

<div
  class="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-inset)] {className}"
  style:width="{size}px"
  style:height="{size}px"
>
  {#if !imgFailed}
    <img
      src={item.iconPath}
      alt={item.name}
      width={size}
      height={size}
      decoding="async"
      class="h-full w-full object-contain p-0.5"
      onerror={() => {
        imgFailed = true;
      }}
    />
  {:else}
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      role="img"
      aria-label={item.name}
      class="h-full w-full"
    >
      <defs>
        <linearGradient id="badge-{item.id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color={theme.bgFrom} />
          <stop offset="100%" stop-color={theme.bgTo} />
        </linearGradient>
      </defs>
      <rect
        x="1"
        y="1"
        width="38"
        height="38"
        rx="7"
        fill="url(#badge-{item.id})"
        stroke={theme.border}
        stroke-width="1.5"
      />
      <text
        x="20"
        y="21"
        text-anchor="middle"
        dominant-baseline="central"
        fill={theme.badgeText}
        font-size="14"
        font-weight="800"
        font-family="system-ui, -apple-system, sans-serif"
      >
        {theme.initials}
      </text>
    </svg>
  {/if}
</div>
