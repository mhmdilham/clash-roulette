import type { HeroItem } from './types';

export const HEROES: readonly HeroItem[] = [
  {
    id: 'barbarian-king',
    name: 'Barbarian King',
    category: 'heroes',
    unlockTh: 4,
    movement: 'ground',
    iconPath: '/assets/coc/heroes/barbarian-king.webp',
  },
  {
    id: 'archer-queen',
    name: 'Archer Queen',
    category: 'heroes',
    unlockTh: 8,
    movement: 'ground',
    iconPath: '/assets/coc/heroes/archer-queen.webp',
  },
  {
    id: 'minion-prince',
    name: 'Minion Prince',
    category: 'heroes',
    unlockTh: 9,
    movement: 'air',
    iconPath: '/assets/coc/heroes/minion-prince.webp',
  },
  {
    id: 'grand-warden',
    name: 'Grand Warden',
    category: 'heroes',
    unlockTh: 11,
    movement: 'air',
    iconPath: '/assets/coc/heroes/grand-warden.webp',
  },
  {
    id: 'royal-champion',
    name: 'Royal Champion',
    category: 'heroes',
    unlockTh: 13,
    movement: 'ground',
    iconPath: '/assets/coc/heroes/royal-champion.webp',
  },
  {
    id: 'dragon-duke',
    name: 'Dragon Duke',
    category: 'heroes',
    unlockTh: 15,
    movement: 'air',
    iconPath: '/assets/coc/heroes/dragon-duke.webp',
  },
] as const;
