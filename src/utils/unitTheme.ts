import type { SpinItem } from '../data/types';

export interface UnitVisualTheme {
  initials: string;
  bgFrom: string;
  bgTo: string;
  border: string;
  badgeText: string;
}

function getUnitInitials(name: string): string {
  const cleaned = name.replace(/\./g, '').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function getUnitFallbackTheme(item: SpinItem): UnitVisualTheme {
  const initials = getUnitInitials(item.name);

  if (item.category === 'heroes') {
    return {
      initials,
      bgFrom: '#b45309',
      bgTo: '#78350f',
      border: '#fbbf24',
      badgeText: '#fef3c7',
    };
  }
  if (item.category === 'equipment') {
    if (item.rarity === 'epic') {
      return {
        initials,
        bgFrom: '#7e22ce',
        bgTo: '#4c1d95',
        border: '#d8b4fe',
        badgeText: '#f3e8ff',
      };
    }
    return {
      initials,
      bgFrom: '#1d4ed8',
      bgTo: '#1e3a8a',
      border: '#93c5fd',
      badgeText: '#dbeafe',
    };
  }
  if (item.category === 'pets') {
    return {
      initials,
      bgFrom: '#047857',
      bgTo: '#064e3b',
      border: '#6ee7b7',
      badgeText: '#d1fae5',
    };
  }
  if (item.category === 'siegeMachines') {
    return {
      initials,
      bgFrom: '#b91c1c',
      bgTo: '#7f1d1d',
      border: '#fca5a5',
      badgeText: '#fee2e2',
    };
  }
  if (item.category === 'spells') {
    if (item.resource === 'dark') {
      return {
        initials,
        bgFrom: '#312e81',
        bgTo: '#1e1b4b',
        border: '#a5b4fc',
        badgeText: '#e0e7ff',
      };
    }
    return {
      initials,
      bgFrom: '#0369a1',
      bgTo: '#0c4a6e',
      border: '#7dd3fc',
      badgeText: '#e0f2fe',
    };
  }
  if (item.category === 'superTroops') {
    return {
      initials,
      bgFrom: '#a21caf',
      bgTo: '#701a75',
      border: '#f0abfc',
      badgeText: '#fae8ff',
    };
  }
  // Standard troops
  if (item.resource === 'dark') {
    return {
      initials,
      bgFrom: '#334155',
      bgTo: '#0f172a',
      border: '#94a3b8',
      badgeText: '#e2e8f0',
    };
  }
  return {
    initials,
    bgFrom: '#9d174d',
    bgTo: '#500724',
    border: '#f9a8d4',
    badgeText: '#fce7f3',
  };
}
