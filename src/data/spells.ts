import type { SpellItem } from './types';

function spell(
  id: string,
  name: string,
  resource: SpellItem['resource'],
  unlockTh: number,
): SpellItem {
  return {
    id,
    name,
    category: 'spells',
    resource,
    unlockTh,
    iconPath: `/assets/coc/spells/${id}.webp`,
  };
}

export const SPELLS: readonly SpellItem[] = [
  // Elixir Spells
  spell('lightning-spell', 'Lightning Spell', 'elixir', 5),
  spell('healing-spell', 'Healing Spell', 'elixir', 6),
  spell('rage-spell', 'Rage Spell', 'elixir', 7),
  spell('jump-spell', 'Jump Spell', 'elixir', 9),
  spell('freeze-spell', 'Freeze Spell', 'elixir', 9),
  spell('clone-spell', 'Clone Spell', 'elixir', 10),
  spell('invisibility-spell', 'Invisibility Spell', 'elixir', 11),
  spell('recall-spell', 'Recall Spell', 'elixir', 13),
  spell('revive-spell', 'Revive Spell', 'elixir', 15),
  spell('heroic-spell', 'Heroic Spell', 'elixir', 17),

  // Dark Spells
  spell('poison-spell', 'Poison Spell', 'dark', 8),
  spell('earthquake-spell', 'Earthquake Spell', 'dark', 8),
  spell('haste-spell', 'Haste Spell', 'dark', 9),
  spell('skeleton-spell', 'Skeleton Spell', 'dark', 9),
  spell('bat-spell', 'Bat Spell', 'dark', 10),
  spell('overgrowth-spell', 'Overgrowth Spell', 'dark', 12),
  spell('ice-block-spell', 'Ice Block Spell', 'dark', 14),
  spell('totem-spell', 'Totem Spell', 'dark', 16),
] as const;
