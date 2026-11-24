import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'src', 'data');
const OUT_DIR = path.join(ROOT, 'public', 'assets', 'coc');

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
  'barbarian': 'Barbarian/Home Village',
  'archer': 'Archer/Home Village',
  'giant': 'Giant/Home Village',
  'minion': 'Minion/Home Village',
  'baby-dragon': 'Baby Dragon/Home Village',
  'witch': 'Witch/Home Village',
  'pekka': 'P.E.K.K.A',
  'lassi': 'L.A.S.S.I',
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

async function fetchWikiThumbnails(titles) {
  const map = new Map();
  const batchSize = 20;
  for (let i = 0; i < titles.length; i += batchSize) {
    const chunk = titles.slice(i, i + batchSize);
    const url = new URL('https://clashofclans.fandom.com/api.php');
    url.searchParams.set('action', 'query');
    url.searchParams.set('titles', chunk.join('|'));
    url.searchParams.set('prop', 'pageimages');
    url.searchParams.set('pithumbsize', '160');
    url.searchParams.set('pilicense', 'any');
    url.searchParams.set('redirects', '1');
    url.searchParams.set('format', 'json');

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'CoC-Attack-Spin-Asset-Fetcher/1.0' },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const redirects = new Map();
      for (const r of data?.query?.redirects ?? []) {
        redirects.set(r.from, r.to);
      }
      const normalized = new Map();
      for (const n of data?.query?.normalized ?? []) {
        normalized.set(n.from, n.to);
      }
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
      // Network/batch failure handled gracefully per item
    }
  }
  return map;
}

async function fetchFileImageUrls(fileTitles) {
  const map = new Map();
  const batchSize = 20;
  for (let i = 0; i < fileTitles.length; i += batchSize) {
    const chunk = fileTitles.slice(i, i + batchSize);
    const url = new URL('https://clashofclans.fandom.com/api.php');
    url.searchParams.set('action', 'query');
    url.searchParams.set('titles', chunk.join('|'));
    url.searchParams.set('prop', 'imageinfo');
    url.searchParams.set('iiprop', 'url');
    url.searchParams.set('iiurlwidth', '160');
    url.searchParams.set('format', 'json');
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'CoC-Attack-Spin-Asset-Fetcher/1.0' },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const normalized = new Map();
      for (const n of data?.query?.normalized ?? []) normalized.set(n.from, n.to);
      const pagesByTitle = new Map();
      for (const page of Object.values(data?.query?.pages ?? {})) {
        const info = page?.imageinfo?.[0];
        if (info?.thumburl || info?.url) {
          pagesByTitle.set(page.title, info.thumburl || info.url);
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

function isValidStaticRaster(buf) {
  if (buf.length < 200 || buf.length > 250_000) return false;
  // PNG: 89 50 4E 47
  const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  // JPEG: FF D8 FF
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  // Static WebP: RIFF....WEBP without ANIM chunk
  const isWebp =
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP' &&
    !buf.includes(Buffer.from('ANIM'));
  return isPng || isJpeg || isWebp;
}

async function downloadFile(url, destPath) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'CoC-Attack-Spin-Asset-Fetcher/1.0' },
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
    const dest = path.join(OUT_DIR, item.category, `${item.id}.png`);
    try {
      const stat = await fs.stat(dest);
      if (stat.size > 200) {
        skipped += 1;
        continue;
      }
    } catch {
      // File not yet cached
    }
    pending.push({ ...item, dest });
  }

  console.log(`Total CoC items: ${allItems.length} (${skipped} cached, ${pending.length} to fetch)`);
  if (pending.length === 0) return;

  const titleByItem = new Map();
  const titles = [];
  for (const item of pending) {
    const primaryTitle = WIKI_TITLE_OVERRIDES[item.id] ?? item.name;
    titleByItem.set(item.id, primaryTitle);
    titles.push(primaryTitle);
  }

  const thumbs = await fetchWikiThumbnails(titles);
  let downloaded = 0;
  const missing = [];

  // Second pass with plain name for any override that didn't return a thumbnail
  const retryTitles = [];
  for (const item of pending) {
    const primary = titleByItem.get(item.id);
    if (!thumbs.has(primary) && primary !== item.name) {
      retryTitles.push(item.name);
    }
  }
  if (retryTitles.length > 0) {
    const retryThumbs = await fetchWikiThumbnails(retryTitles);
    for (const [k, v] of retryThumbs.entries()) {
      thumbs.set(k, v);
    }
  }

  // Third pass: direct File: lookup for equipment/spells/troops (or if pageimage wasn't a valid static raster)
  const fileCandidates = [];
  const fileMapById = new Map();
  for (const item of pending) {
    const candidates =
      item.category === 'equipment'
        ? [
            `File:Hero Equipment ${item.name}.png`,
            `File:${item.name} Equipment.png`,
            `File:${item.name}.png`,
          ]
        : [
            `File:Avatar ${item.name}.png`,
            `File:${item.name} info.png`,
            `File:${item.name}.png`,
          ];
    fileMapById.set(item.id, candidates);
    fileCandidates.push(...candidates);
  }
  const fileUrls = fileCandidates.length > 0 ? await fetchFileImageUrls(fileCandidates) : new Map();

  // Polite bounded concurrency (5 at a time)
  const queue = [...pending];
  const workers = Array.from({ length: 5 }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      const urlsToTry = [];
      const primaryThumb = thumbs.get(titleByItem.get(item.id)) ?? thumbs.get(item.name);
      if (primaryThumb) urlsToTry.push(primaryThumb);
      for (const c of fileMapById.get(item.id) ?? []) {
        if (fileUrls.has(c)) urlsToTry.push(fileUrls.get(c));
      }

      let ok = false;
      for (const u of urlsToTry) {
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
