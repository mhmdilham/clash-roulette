import type { SuperTroopItem, TroopRole } from './types';

function superTroop(
  id: string,
  name: string,
  baseTroopId: string,
  resource: SuperTroopItem['resource'],
  movement: SuperTroopItem['movement'],
  unlockTh: number,
  roles: readonly TroopRole[],
): SuperTroopItem {
  return {
    id,
    name,
    baseTroopId,
    category: 'superTroops',
    resource,
    movement,
    unlockTh,
    roles,
    iconPath: `/assets/coc/superTroops/${id}.png`,
  };
}

export const SUPER_TROOPS: readonly SuperTroopItem[] = [
  superTroop('super-barbarian', 'Super Barbarian', 'barbarian', 'elixir', 'ground', 11, ['Funnel', 'Clean-up', 'Main']),
  superTroop('super-archer', 'Super Archer', 'archer', 'elixir', 'ground', 11, ['Main', 'Damage Dealer', 'Support']),
  superTroop('super-giant', 'Super Giant', 'giant', 'elixir', 'ground', 12, ['Tank', 'Support']),
  superTroop('sneaky-goblin', 'Sneaky Goblin', 'goblin', 'elixir', 'ground', 11, ['Funnel', 'Clean-up', 'Support']),
  superTroop('super-wall-breaker', 'Super Wall Breaker', 'wall-breaker', 'elixir', 'ground', 11, ['Support']),
  superTroop('rocket-balloon', 'Rocket Balloon', 'balloon', 'elixir', 'air', 12, ['Support', 'Funnel', 'Damage Dealer']),
  superTroop('super-wizard', 'Super Wizard', 'wizard', 'elixir', 'ground', 12, ['Damage Dealer', 'Funnel', 'Support']),
  superTroop('super-dragon', 'Super Dragon', 'dragon', 'elixir', 'air', 12, ['Main', 'Damage Dealer', 'Tank']),
  superTroop('inferno-dragon', 'Inferno Dragon', 'baby-dragon', 'elixir', 'air', 12, ['Main', 'Damage Dealer', 'Funnel']),
  superTroop('super-minion', 'Super Minion', 'minion', 'dark', 'air', 12, ['Damage Dealer', 'Funnel', 'Support']),
  superTroop('super-valkyrie', 'Super Valkyrie', 'valkyrie', 'dark', 'ground', 12, ['Support', 'Damage Dealer', 'Funnel']),
  superTroop('super-witch', 'Super Witch', 'witch', 'dark', 'ground', 12, ['Main', 'Tank']),
  superTroop('ice-hound', 'Ice Hound', 'lava-hound', 'dark', 'air', 12, ['Tank', 'Support']),
  superTroop('super-bowler', 'Super Bowler', 'bowler', 'dark', 'ground', 12, ['Main', 'Damage Dealer']),
  superTroop('super-miner', 'Super Miner', 'miner', 'elixir', 'ground', 13, ['Main', 'Damage Dealer']),
  superTroop('super-hog-rider', 'Super Hog Rider', 'hog-rider', 'dark', 'ground', 13, ['Main', 'Damage Dealer']),
  superTroop('super-yeti', 'Super Yeti', 'yeti', 'elixir', 'ground', 13, ['Main', 'Tank', 'Damage Dealer']),
] as const;
