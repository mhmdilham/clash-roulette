import type { PetItem } from './types';

function pet(id: string, name: string, unlockTh: number): PetItem {
  return {
    id,
    name,
    category: 'pets',
    unlockTh,
    iconPath: `/assets/coc/pets/${id}.webp`,
  };
}

export const PETS: readonly PetItem[] = [
  pet('lassi', 'L.A.S.S.I', 14),
  pet('electro-owl', 'Electro Owl', 14),
  pet('mighty-yak', 'Mighty Yak', 14),
  pet('unicorn', 'Unicorn', 14),
  pet('frosty', 'Frosty', 15),
  pet('diggy', 'Diggy', 15),
  pet('poison-lizard', 'Poison Lizard', 15),
  pet('phoenix', 'Phoenix', 15),
  pet('spirit-fox', 'Spirit Fox', 16),
  pet('angry-jelly', 'Angry Jelly', 16),
  pet('sneezy', 'Sneezy', 17),
  pet('greedy-raven', 'Greedy Raven', 18),
] as const;
