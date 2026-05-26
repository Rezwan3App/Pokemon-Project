/**
 * Pokémon news service. Fetches public RSS feeds (permitted syndication
 * format) and caches results for an hour. No scraping.
 *
 * Sources can be added by extending FEEDS. If all sources fail or are slow,
 * we return a small curated fallback list so the UI never blanks out.
 */

const FEEDS = [
  { id: 'pokebeach', name: 'PokéBeach', url: 'https://www.pokebeach.com/feed' },
];

const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour
let cache = { at: 0, items: [] };

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithTimeout(url, ms = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'PokemonTcgPriceTracker/1.0 (+local dev)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function decodeEntities(s) {
  if (!s) return '';
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function stripHtml(s) {
  return decodeEntities(s).replace(/<[^>]+>/g, '').trim();
}

function extractTag(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = re.exec(block);
  return m ? decodeEntities(m[1]).trim() : null;
}

function parseRss(xml, source) {
  const items = [];
  const itemRegex = /<item\b[\s\S]*?<\/item>/gi;
  let m;
  while ((m = itemRegex.exec(xml)) !== null) {
    const block = m[0];
    const title = stripHtml(extractTag(block, 'title') || '');
    const link = extractTag(block, 'link') || '';
    const pubDate = extractTag(block, 'pubDate') || extractTag(block, 'dc:date') || '';
    const description = stripHtml(extractTag(block, 'description') || '').slice(0, 220);
    if (!title || !link) continue;
    items.push({
      title,
      link: link.trim(),
      pubDate,
      description,
      source,
    });
  }
  return items;
}

const FALLBACK_ITEMS = [
  {
    title: 'Pokémon TCG official news hub',
    link: 'https://www.pokemon.com/us/pokemon-news',
    pubDate: '',
    description: 'Latest set announcements, tournaments, and product reveals from The Pokémon Company.',
    source: 'pokemon.com',
  },
  {
    title: 'Pokémon TCG release calendar',
    link: 'https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_Trading_Card_Game_expansions',
    pubDate: '',
    description: 'Upcoming and past Pokémon TCG expansion release dates.',
    source: 'bulbapedia',
  },
  {
    title: 'TCGplayer marketplace insights',
    link: 'https://infinite.tcgplayer.com/category/pokemon/',
    pubDate: '',
    description: 'Articles on what cards collectors and players are buying.',
    source: 'tcgplayer',
  },
];

/**
 * Returns recent Pokémon news items, cached for an hour. Always returns at
 * least the fallback list so the UI has something to render.
 */
export async function getNews(limit = 8) {
  const now = Date.now();
  if (cache.items.length && now - cache.at < CACHE_TTL_MS) {
    return cache.items.slice(0, limit);
  }

  const results = await Promise.allSettled(
    FEEDS.map(async (feed) => {
      try {
        const res = await fetchWithTimeout(feed.url);
        if (!res.ok) throw new Error(`RSS ${res.status}`);
        const xml = await res.text();
        return parseRss(xml, feed.name);
      } catch (err) {
        console.warn(`[news:${feed.id}] ${err.message}`);
        return [];
      }
    })
  );

  const merged = [];
  for (const r of results) {
    if (r.status === 'fulfilled') merged.push(...r.value);
  }

  // Sort by pubDate desc when possible
  merged.sort((a, b) => {
    const da = Date.parse(a.pubDate) || 0;
    const db = Date.parse(b.pubDate) || 0;
    return db - da;
  });

  const items = merged.length ? merged.slice(0, 20) : FALLBACK_ITEMS;
  cache = { at: now, items };
  return items.slice(0, limit);
}
