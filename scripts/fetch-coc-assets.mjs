import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'src', 'data');
const OUT_DIR = path.join(ROOT, 'public', 'assets', 'coc');
const FORCE = process.argv.includes('--force');
const THUMB_SIZE = '128';

const DATA_FILES = [
  { file: 'heroes.ts', category: 'heroes' },
  { file: 'equipment.ts', category: 'equipment' },
  { file: 'pets.ts', category: 'pets' },
  { file: 'troops.ts', category: 'troops' },
  { file: 'superTroops.ts', category: 'superTroops' },
  { file: 'spells.ts', category: 'spells' },
  { file: 'siegeMachines.ts', category: 'siegeMachines' },
];

const WIKI_TITLE_OVERRIDES = {
  barbarian: 'Barbarian/Home Village',
  archer: 'Archer/Home Village',
  giant: 'Giant/Home Village',
  minion: 'Minion/Home Village',
  'baby-dragon': 'Baby Dragon/Home Village',
  witch: 'Witch/Home Village',
  pekka: 'P.E.K.K.A',
  lassi: 'L.A.S.S.I',
};

function parseItemsFromSource(content, category) {
  const items = [];
  if (category === 'heroes') {
    const regex = /id:\s*'([^']+)',\s*\n\s*name:\s*'([^']+)'/g;
    for (const m of content.matchAll(regex)) {
      items.push({ id: m[1], name: m[2], category });
    }
    return items;
  }
  const fnCallRegex = /\b(?:eq|pet|troop|superTroop|spell|siege)\(\s*'([^']+)'\s*,\s*'([^']+)'/g;
  for (const m of content.matchAll(fnCallRegex)) {
    items.push({ id: m[1], name: m[2], category });
  }
  return items;
}

function getPreferredFileCandidates(item) {
  switch (item.category) {
    case 'equipment':
      return [
        `File:Hero Equipment ${item.name}.png`,
        `File:${item.name} Equipment.png`,
        `File:${item.name}.png`,
        `File:${item.name} info.png`,
      ];
    case 'spells':
      return [
        `File:${item.name} info.png`,
        `File:Avatar ${item.name}.png`,
        `File:${item.name}.png`,
      ];
    case 'heroes':
      return [
        `File:Avatar ${item.name}.png`,
        `File:${item.name} info.png`,
        `File:${item.name}.png`,
      ];
    default:
      // troops, superTroops, pets, siegeMachines
      return [
        `File:Avatar ${item.name}.png`,
        `File:${item.name} info.png`,
        `File:${item.name}.png`,
      ];
  }
}

async function fetchFileImageInfo(fileTitles) {
  const map = new Map();
  const unique = [...new Set(fileTitles)];
  const batchSize = 20;
  for (let i = 0; i < unique.length; i += batchSize) {
    const chunk = unique.slice(i, i + batchSize);
    const url = new URL('https://clashofclans.fandom.com/api.php');
    url.searchParams.set('action', 'query');
    url.searchParams.set('titles', chunk.join('|'));
    url.searchParams.set('prop', 'imageinfo');
    url.searchParams.set('iiprop', 'url|size');
    url.searchParams.set('iiurlwidth', THUMB_SIZE);
    url.searchParams.set('format', 'json');

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'CoC-Attack-Spin-Asset-Fetcher/2.0' },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const normalized = new Map();
      for (const n of data?.query?.normalized ?? []) normalized.set(n.from, n.to);
      const pagesByTitle = new Map();
      for (const page of Object.values(data?.query?.pages ?? {})) {
        const info = page?.imageinfo?.[0];
        const src = info?.thumburl || info?.url;
        if (src) {
          const w = info.thumbwidth || info.width || 128;
          const h = info.thumbheight || info.height || 128;
          const ratio = Math.max(w, h) / Math.max(1, Math.min(w, h));
          pagesByTitle.set(page.title, { url: src, ratio });
        }
      }
      for (const orig of chunk) {
        const norm = normalized.get(orig) ?? orig;
        const found = pagesByTitle.get(norm);
        if (found) map.set(orig, found);
      }
    } catch {
      // ignore batch error
    }
  }
  return map;
}

async function fetchWikiThumbnails(titles) {
  const map = new Map();
  const unique = [...new Set(titles)];
  const batchSize = 20;
  for (let i = 0; i < unique.length; i += batchSize) {
    const chunk = unique.slice(i, i + batchSize);
    const url = new URL('https://clashofclans.fandom.com/api.php');
    url.searchParams.set('action', 'query');
    url.searchParams.set('titles', chunk.join('|'));
    url.searchParams.set('prop', 'pageimages');
    url.searchParams.set('pithumbsize', THUMB_SIZE);
    url.searchParams.set('pilicense', 'any');
    url.searchParams.set('redirects', '1');
    url.searchParams.set('format', 'json');

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'CoC-Attack-Spin-Asset-Fetcher/2.0' },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const redirects = new Map();
      for (const r of data?.query?.redirects ?? []) redirects.set(r.from, r.to);
      const normalized = new Map();
      for (const n of data?.query?.normalized ?? []) normalized.set(n.from, n.to);
      const pagesByTitle = new Map();
      for (const page of Object.values(data?.query?.pages ?? {})) {
        if (page?.thumbnail?.source) {
          pagesByTitle.set(page.title, page.thumbnail.source);
        }
      }
      for (const orig of chunk) {
        const norm = normalized.get(orig) ?? orig;
        const finalTitle = redirects.get(norm) ?? norm;
        const thumb = pagesByTitle.get(finalTitle) ?? pagesByTitle.get(norm);
        if (thumb) map.set(orig, thumb);
      }
    } catch {
      // ignore batch error
    }
  }
  return map;
}

function isValidStaticRaster(buf) {
  if (buf.length < 200 || buf.length > 200_000) return false;
  const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const isWebp =
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP' &&
    !buf.includes(Buffer.from('ANIM'));
  return isPng || isJpeg || isWebp;
}

async function downloadFile(url, destPath) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'CoC-Attack-Spin-Asset-Fetcher/2.0',
      Accept: 'image/webp,image/png,*/*;q=0.8',
    },
  });
  if (!res.ok) return false;
  const ct = res.headers.get('content-type') || '';
  if (!ct.toLowerCase().startsWith('image/')) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  if (!isValidStaticRaster(buf)) return false;
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.writeFile(destPath, buf);
  return true;
}

async function main() {
  const allItems = [];
  for (const { file, category } of DATA_FILES) {
    const content = await fs.readFile(path.join(DATA_DIR, file), 'utf8');
    allItems.push(...parseItemsFromSource(content, category));
  }

  const pending = [];
  let skipped = 0;
  for (const item of allItems) {
    const dest = path.join(OUT_DIR, item.category, `${item.id}.webp`);
    if (!FORCE) {
      try {
        const stat = await fs.stat(dest);
        if (stat.size > 200) {
          skipped += 1;
          continue;
        }
      } catch {
        // File not cached yet
      }
    }
    pending.push({ ...item, dest });
  }

  console.log(`Total CoC items: ${allItems.length} (${skipped} cached, ${pending.length} to fetch)`);
  if (pending.length === 0) return;

  // Step 1: Prefer clean square Avatar / Info / Equipment File: icons first
  const fileMapById = new Map();
  const allFileCandidates = [];
  for (const item of pending) {
    const candidates = getPreferredFileCandidates(item);
    fileMapById.set(item.id, candidates);
    allFileCandidates.push(...candidates);
  }
  const fileInfoMap = await fetchFileImageInfo(allFileCandidates);

  // Step 2: Fetch pageimages as fallback for any item without a clean square File: match
  const pageTitles = [];
  const titleByItem = new Map();
  for (const item of pending) {
    const primaryTitle = WIKI_TITLE_OVERRIDES[item.id] ?? item.name;
    titleByItem.set(item.id, primaryTitle);
    pageTitles.push(primaryTitle);
    if (primaryTitle !== item.name) pageTitles.push(item.name);
  }
  const pageThumbs = await fetchWikiThumbnails(pageTitles);

  let downloaded = 0;
  const missing = [];
  const queue = [...pending];

  const workers = Array.from({ length: 6 }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;

      const candidates = fileMapById.get(item.id) ?? [];
      // Order square candidates (ratio <= 1.35) ahead of taller/wider ones, then pageimages fallback
      const squareUrls = [];
      const fallbackUrls = [];
      for (const c of candidates) {
        const info = fileInfoMap.get(c);
        if (!info) continue;
        if (info.ratio <= 1.35) squareUrls.push(info.url);
        else fallbackUrls.push(info.url);
      }
      const pThumb = pageThumbs.get(titleByItem.get(item.id)) ?? pageThumbs.get(item.name);
      if (pThumb) fallbackUrls.push(pThumb);

      let ok = false;
      for (const u of [...squareUrls, ...fallbackUrls]) {
        if (await downloadFile(u, item.dest)) {
          ok = true;
          break;
        }
      }
      if (ok) downloaded += 1;
      else missing.push(`${item.category}/${item.id}`);
    }
  });
  await Promise.all(workers);

  console.log(`Fetched: ${downloaded}, Cached: ${skipped}, Fallback SVG: ${missing.length}`);
  if (missing.length > 0) {
    console.log(`Items using SVG fallback: ${missing.join(', ')}`);
  }
}

main().catch((err) => {
  console.error('Asset fetch failed:', err);
  process.exitCode = 1;
});
