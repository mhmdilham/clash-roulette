import type { SiegeMachineItem } from './types';

function siege(id: string, name: string, unlockTh: number): SiegeMachineItem {
  return {
    id,
    name,
    category: 'siegeMachines',
    unlockTh,
    iconPath: `/assets/coc/siegeMachines/${id}.webp`,
  };
}

/**
 * unlockTh reflects official Workshop unlock Town Hall (TH12–TH16).
 * When "Termasuk Donasi CC (TH10+)" is ON, all Siege Machines are available from TH10+.
 */
export const SIEGE_MACHINES: readonly SiegeMachineItem[] = [
  siege('wall-wrecker', 'Wall Wrecker', 12),
  siege('battle-blimp', 'Battle Blimp', 12),
  siege('stone-slammer', 'Stone Slammer', 12),
  siege('siege-barracks', 'Siege Barracks', 13),
  siege('log-launcher', 'Log Launcher', 13),
  siege('flame-flinger', 'Flame Flinger', 14),
  siege('battle-drill', 'Battle Drill', 15),
  siege('troop-launcher', 'Troop Launcher', 16),
] as const;
