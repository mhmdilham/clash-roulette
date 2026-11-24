import type { EquipmentItem } from './types';

function eq(
  id: string,
  name: string,
  heroId: EquipmentItem['heroId'],
  rarity: EquipmentItem['rarity'],
  unlockTh: number,
): EquipmentItem {
  return {
    id,
    name,
    category: 'equipment',
    heroId,
    rarity,
    unlockTh,
    iconPath: `/assets/coc/equipment/${id}.webp`,
  };
}

export const EQUIPMENT: readonly EquipmentItem[] = [
  // Barbarian King
  eq('barbarian-puppet', 'Barbarian Puppet', 'barbarian-king', 'common', 8),
  eq('rage-vial', 'Rage Vial', 'barbarian-king', 'common', 8),
  eq('earthquake-boots', 'Earthquake Boots', 'barbarian-king', 'common', 8),
  eq('vampstache', 'Vampstache', 'barbarian-king', 'common', 10),
  eq('giant-gauntlet', 'Giant Gauntlet', 'barbarian-king', 'epic', 8),
  eq('spiky-ball', 'Spiky Ball', 'barbarian-king', 'epic', 8),
  eq('snake-bracelet', 'Snake Bracelet', 'barbarian-king', 'epic', 8),
  eq('stick-horse', 'Stick Horse', 'barbarian-king', 'epic', 8),

  // Archer Queen
  eq('archer-puppet', 'Archer Puppet', 'archer-queen', 'common', 8),
  eq('invisibility-vial', 'Invisibility Vial', 'archer-queen', 'common', 8),
  eq('giant-arrow', 'Giant Arrow', 'archer-queen', 'common', 9),
  eq('healer-puppet', 'Healer Puppet', 'archer-queen', 'common', 12),
  eq('frozen-arrow', 'Frozen Arrow', 'archer-queen', 'epic', 8),
  eq('magic-mirror', 'Magic Mirror', 'archer-queen', 'epic', 8),
  eq('action-figure', 'Action Figure', 'archer-queen', 'epic', 8),
  eq('monolith-arrow', 'Monolith Arrow', 'archer-queen', 'epic', 8),

  // Minion Prince
  eq('henchmen-puppet', 'Henchmen Puppet', 'minion-prince', 'common', 9),
  eq('dark-orb', 'Dark Orb', 'minion-prince', 'common', 9),
  eq('metal-pants', 'Metal Pants', 'minion-prince', 'common', 10),
  eq('noble-iron', 'Noble Iron', 'minion-prince', 'common', 11),
  eq('dark-crown', 'Dark Crown', 'minion-prince', 'epic', 9),
  eq('meteor-staff', 'Meteor Staff', 'minion-prince', 'epic', 9),
  eq('portal-pendant', 'Portal Pendant', 'minion-prince', 'epic', 9),

  // Grand Warden
  eq('eternal-tome', 'Eternal Tome', 'grand-warden', 'common', 11),
  eq('life-gem', 'Life Gem', 'grand-warden', 'common', 11),
  eq('rage-gem', 'Rage Gem', 'grand-warden', 'common', 11),
  eq('healing-tome', 'Healing Tome', 'grand-warden', 'common', 13),
  eq('fireball', 'Fireball', 'grand-warden', 'epic', 11),
  eq('lavaloon-puppet', 'Lavaloon Puppet', 'grand-warden', 'epic', 11),
  eq('heroic-torch', 'Heroic Torch', 'grand-warden', 'epic', 11),

  // Royal Champion
  eq('royal-gem', 'Royal Gem', 'royal-champion', 'common', 13),
  eq('seeking-shield', 'Seeking Shield', 'royal-champion', 'common', 13),
  eq('hog-rider-puppet', 'Hog Rider Puppet', 'royal-champion', 'common', 14),
  eq('haste-vial', 'Haste Vial', 'royal-champion', 'common', 15),
  eq('rocket-spear', 'Rocket Spear', 'royal-champion', 'epic', 13),
  eq('electro-boots', 'Electro Boots', 'royal-champion', 'epic', 13),
  eq('frost-flake', 'Frost Flake', 'royal-champion', 'epic', 13),

  // Dragon Duke
  eq('fire-heart', 'Fire Heart', 'dragon-duke', 'common', 15),
  eq('flame-blower', 'Flame Blower', 'dragon-duke', 'common', 15),
  eq('stun-blaster', 'Stun Blaster', 'dragon-duke', 'common', 15),
  eq('rocket-backpack', 'Rocket Backpack', 'dragon-duke', 'epic', 15),
  eq('electro-fangs', 'Electro Fangs', 'dragon-duke', 'epic', 15),
] as const;
