# Clash Roulette

**Clash of Clans Loadout Spinner** — an interactive spin wheel generator for building random Clash of Clans attack loadouts by Town Hall (TH1–TH19).

Spin your way through **Troops**, **Super Troops**, **Spells**, **Heroes**, **Hero Equipment**, **Pets**, and **Siege Machines**, complete with realistic TH limits, role/movement filters, lock & per-slot re-spin controls, and one-click PNG/text export.

## Features

- **Town Hall 1–19 Support**: Automatically unlocks units, categories, and realistic slot caps based on your selected Town Hall.
- **7 Spin Categories**: Troops, Super Troops, Spells, Heroes, Hero Equipment, Pets, and Siege Machines (with optional Clan Castle donation toggle for TH10+).
- **Smart Filters**:
  - Filter Troops & Super Troops by combat role (`Main`, `Tank`, `Support`, `Damage Dealer`, `Funnel`, `Clean-up`) with `OR` / `AND` matching and `All` / `Ground` / `Air` movement filters.
  - Bidirectional **Hero ↔ Equipment** relevance filter so Equipment spins match your chosen Heroes (and vice versa).
  - Toggleable **TH Limits**, **No Duplicates**, and **Fast Spin** mode.
- **Loadout Controls**: Lock favorite slots, re-spin individual slots directly on the wheel, clear unlocked slots, or reset everything.
- **Export & Share**: Download a styled **PNG Loadout Card** or copy a formatted text summary ready for Discord / WhatsApp.
- **Bilingual UI (`ID` / `EN`)**: Instant Indonesian and English language switcher persisted in `localStorage`.
- **Web Audio Sound Effects**: Synthesized wheel ticks and reveal chimes with volume and mute controls.

## Tech Stack

- [Svelte 5](https://svelte.dev/) + TypeScript
- [Vite 6](https://vite.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Vitest](https://vitest.dev/) + ESLint + Prettier + Knip
- [`html-to-image`](https://github.com/bubkoo/html-to-image) & [`lucide-svelte`](https://lucide.dev/)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation & Development

```bash
git clone https://github.com/mhmdilham/clash-roulette.git
cd clash-roulette
npm install
npm run dev
```

### Available Scripts

| Command                | Description                                       |
| ---------------------- | ------------------------------------------------- |
| `npm run dev`          | Start Vite development server                     |
| `npm run build`        | Build production bundle into `dist/`              |
| `npm run preview`      | Preview the production build locally              |
| `npm test`             | Run Vitest unit test suite                        |
| `npm run check`        | Run `svelte-check` type checking                  |
| `npm run lint`         | Run ESLint                                        |
| `npm run format`       | Format codebase with Prettier                     |
| `npm run format:check` | Check Prettier formatting                         |
| `npm run knip`         | Check for unused files, exports, and dependencies |

## License

This project is licensed under the **GNU General Public License v3.0** — see the [LICENSE](./LICENSE) file for details.

## Disclaimer

This content is not affiliated with, endorsed, sponsored, or specifically approved by Supercell and Supercell is not responsible for it.
