import type { TroopItem, TroopRole } from './types';

function troop(
  id: string,
  name: string,
  resource: TroopItem['resource'],
  movement: TroopItem['movement'],
  unlockTh: number,
  roles: readonly TroopRole[],
): TroopItem {
  return {
    id,
    name,
    category: 'troops',
    resource,
    movement,
    unlockTh,
    roles,
    iconPath: `/assets/coc/troops/${id}.webp`,
  };
}

export const TROOPS: readonly TroopItem[] = [
  // Elixir Troops
  troop('barbarian', 'Barbarian', 'elixir', 'ground', 1, ['Support', 'Clean-up']),
  troop('archer', 'Archer', 'elixir', 'ground', 2, ['Support', 'Clean-up', 'Funnel']),
  troop('giant', 'Giant', 'elixir', 'ground', 2, ['Tank', 'Support']),
  troop('goblin', 'Goblin', 'elixir', 'ground', 2, ['Clean-up', 'Funnel']),
  troop('wall-breaker', 'Wall Breaker', 'elixir', 'ground', 3, ['Support']),
  troop('balloon', 'Balloon', 'elixir', 'air', 4, ['Main', 'Damage Dealer', 'Support']),
  troop('wizard', 'Wizard', 'elixir', 'ground', 5, ['Damage Dealer', 'Funnel', 'Clean-up']),
  troop('healer', 'Healer', 'elixir', 'air', 6, ['Support']),
  troop('dragon', 'Dragon', 'elixir', 'air', 7, ['Main', 'Damage Dealer', 'Funnel']),
  troop('pekka', 'P.E.K.K.A', 'elixir', 'ground', 8, ['Main', 'Tank', 'Damage Dealer', 'Funnel']),
  troop('baby-dragon', 'Baby Dragon', 'elixir', 'air', 9, ['Funnel', 'Clean-up', 'Support']),
  troop('miner', 'Miner', 'elixir', 'ground', 10, ['Main', 'Damage Dealer', 'Clean-up']),
  troop('electro-dragon', 'Electro Dragon', 'elixir', 'air', 11, [
    'Main',
    'Damage Dealer',
    'Funnel',
  ]),
  troop('yeti', 'Yeti', 'elixir', 'ground', 12, ['Main', 'Tank', 'Funnel']),
  troop('dragon-rider', 'Dragon Rider', 'elixir', 'air', 13, ['Main', 'Damage Dealer']),
  troop('electro-titan', 'Electro Titan', 'elixir', 'ground', 14, ['Main', 'Tank', 'Support']),
  troop('root-rider', 'Root Rider', 'elixir', 'ground', 15, ['Main', 'Tank', 'Support']),
  troop('thrower', 'Thrower', 'elixir', 'ground', 16, ['Main', 'Damage Dealer', 'Support']),
  troop('meteor-golem', 'Meteor Golem', 'elixir', 'ground', 18, ['Main', 'Tank']),

  // Dark Elixir Troops
  troop('minion', 'Minion', 'dark', 'air', 7, ['Clean-up', 'Funnel', 'Support']),
  troop('hog-rider', 'Hog Rider', 'dark', 'ground', 7, ['Main', 'Damage Dealer']),
  troop('valkyrie', 'Valkyrie', 'dark', 'ground', 8, ['Main', 'Damage Dealer', 'Funnel']),
  troop('golem', 'Golem', 'dark', 'ground', 8, ['Tank', 'Support']),
  troop('witch', 'Witch', 'dark', 'ground', 9, ['Main', 'Support', 'Damage Dealer']),
  troop('lava-hound', 'Lava Hound', 'dark', 'air', 9, ['Tank', 'Support']),
  troop('bowler', 'Bowler', 'dark', 'ground', 10, ['Main', 'Damage Dealer']),
  troop('ice-golem', 'Ice Golem', 'dark', 'ground', 11, ['Tank', 'Support']),
  troop('headhunter', 'Headhunter', 'dark', 'ground', 12, ['Support', 'Damage Dealer']),
  troop('apprentice-warden', 'Apprentice Warden', 'dark', 'ground', 13, ['Support']),
  troop('druid', 'Druid', 'dark', 'ground', 14, ['Support', 'Tank']),
  troop('furnace', 'Furnace', 'dark', 'ground', 15, ['Support', 'Funnel', 'Damage Dealer']),
  troop('ruin-witch', 'Ruin Witch', 'dark', 'ground', 17, ['Main', 'Support', 'Tank']),
] as const;
