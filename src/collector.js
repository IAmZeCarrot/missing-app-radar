const API_URL = 'https://hn.algolia.com/api/v1/search_by_date';

export const DEFAULT_QUERIES = [
  'Ask HN app for',
  'Ask HN tool for',
  'Ask HN software for',
  'wish there was an app',
  'looking for an app'
];

export function buildSearchUrl(query, { days = 30, now = Date.now(), hitsPerPage = 40 } = {}) {
  const createdAfter = Math.floor((now - days * 86400000) / 1000);
  const params = new URLSearchParams({
    query,
    tags: '(story,comment)',
    numericFilters: `created_at_i>${createdAfter}`,
    hitsPerPage: String(hitsPerPage)
  });
  return `${API_URL}?${params}`;
}

export function normalizeHit(hit, query) {
  const title = hit.title || hit.story_title || '';
  const text = (hit.comment_text || hit.story_text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const objectID = String(hit.objectID || '');
  if (!objectID || (!title && !text)) return null;
  return {
    id: `hn-${objectID}`,
    source: 'Hacker News',
    title: title || text.slice(0, 110),
    excerpt: text.slice(0, 280),
    author: hit.author || 'unknown',
    createdAt: hit.created_at,
    points: hit.points || 0,
    comments: hit.num_comments || 0,
    matchedQuery: query,
    url: `https://news.ycombinator.com/item?id=${hit.story_id || objectID}`
  };
}

export async function collectFromHackerNews({ queries = DEFAULT_QUERIES, days = 30, fetchImpl = fetch } = {}) {
  const batches = await Promise.all(queries.map(async (query) => {
    const response = await fetchImpl(buildSearchUrl(query, { days }));
    if (!response.ok) throw new Error(`Hacker News search failed with ${response.status}`);
    const data = await response.json();
    return data.hits.map((hit) => normalizeHit(hit, query)).filter(Boolean);
  }));
  const unique = new Map(batches.flat().map((item) => [item.id, item]));
  return [...unique.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
