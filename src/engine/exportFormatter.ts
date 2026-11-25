import { getHeroById, getItemById } from '../data';
import type { LoadoutState } from '../data/types';
import { TRANSLATIONS, type Locale } from '../utils/i18n';

function nameOf(id: string): string {
  return getItemById(id)?.name ?? id;
}

export function formatLoadoutText(
  loadout: LoadoutState,
  townHall: number,
  locale: Locale = 'id',
): string {
  const t = TRANSLATIONS[locale];
  const lines: string[] = [`⚔️ Clash Roulette — CoC Loadout Spinner (TH${townHall})`];

  if (loadout.heroes.length > 0) {
    lines.push('');
    lines.push('👑 Heroes:');
    for (const hero of loadout.heroes) {
      const heroName = getHeroById(hero.heroId)?.name ?? hero.heroId;
      const eqNames = hero.equipment.map((e) => nameOf(e.itemId));
      const eqPart = eqNames.length > 0 ? ` [${eqNames.join(', ')}]` : '';
      const petPart = hero.pet ? ` + 🐾 ${nameOf(hero.pet.itemId)}` : '';
      lines.push(`- ${heroName}${eqPart}${petPart}`);
    }
  }

  if (loadout.unpairedEquipment.length > 0) {
    lines.push('');
    lines.push(
      `🛡️ ${t.exportUnpairedEquipment}: ${loadout.unpairedEquipment.map((e) => nameOf(e.itemId)).join(', ')}`,
    );
  }

  if (loadout.unpairedPets.length > 0) {
    lines.push('');
    lines.push(
      `🐾 ${t.exportReservePets}: ${loadout.unpairedPets.map((p) => nameOf(p.itemId)).join(', ')}`,
    );
  }

  if (loadout.troops.length > 0) {
    lines.push('');
    lines.push(`🪖 Troops: ${loadout.troops.map((t) => nameOf(t.itemId)).join(', ')}`);
  }

  if (loadout.superTroops.length > 0) {
    lines.push('');
    lines.push(`⚡ Super Troops: ${loadout.superTroops.map((t) => nameOf(t.itemId)).join(', ')}`);
  }

  if (loadout.spells.length > 0) {
    lines.push('');
    lines.push(`🧪 Spells: ${loadout.spells.map((s) => nameOf(s.itemId)).join(', ')}`);
  }

  if (loadout.siegeMachines.length > 0) {
    lines.push('');
    lines.push(`🏰 Siege: ${loadout.siegeMachines.map((s) => nameOf(s.itemId)).join(', ')}`);
  }

  return lines.join('\n');
}
