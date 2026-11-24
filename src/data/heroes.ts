import type { HeroItem } from './types';

export const HEROES: readonly HeroItem[] = [
  {
    id: 'barbarian-king',
    name: 'Barbarian King',
    category: 'heroes',
    unlockTh: 4,
    movement: 'ground',
    iconPath: '/assets/coc/heroes/barbarian-king.png',
  },
  {
    id: 'archer-queen',
    name: 'Archer Queen',
    category: 'heroes',
    unlockTh: 8,
    movement: 'ground',
    iconPath: '/assets/coc/heroes/archer-queen.png',
  },
  {
    id: 'minion-prince',
    name: 'Minion Prince',
    category: 'heroes',
    unlockTh: 9,
    movement: 'air',
    iconPath: '/assets/coc/heroes/minion-prince.png',
  },
  {
    id: 'grand-warden',
    name: 'Grand Warden',
    category: 'heroes',
    unlockTh: 11,
    movement: 'air',
    iconPath: '/assets/coc/heroes/grand-warden.png',
  },
  {
    id: 'royal-champion',
    name: 'Royal Champion',
    category: 'heroes',
    unlockTh: 13,
    movement: 'ground',
    iconPath: '/assets/coc/heroes/royal-champion.png',
  },
  {
    id: 'dragon-duke',
    name: 'Dragon Duke',
    category: 'heroes',
    unlockTh: 15,
    movement: 'air',
    iconPath: '/assets/coc/heroes/dragon-duke.png',
  },
] as const;
