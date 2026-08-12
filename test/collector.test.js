import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSearchUrl, collectFromHackerNews, normalizeHit } from '../src/collector.js';

test('builds a date-bounded Algolia query', () => {
  const url = new URL(buildSearchUrl('app for', { days: 1, now: 172800000, hitsPerPage: 12 }));
  assert.equal(url.pathname, '/api/v1/search_by_date');
  assert.equal(url.searchParams.get('query'), 'app for');
  assert.equal(url.searchParams.get('numericFilters'), 'created_at_i>86400');
  assert.equal(url.searchParams.get('hitsPerPage'), '12');
});

test('normalizes comments and links to their parent story', () => {
  const item = normalizeHit({ objectID:'9', story_id:7, story_title:'Need a tool', comment_text:'<p>Hello <b>world</b></p>', author:'sam', created_at:'2026-08-01T00:00:00Z' }, 'tool');
  assert.equal(item.id, 'hn-9');
  assert.equal(item.excerpt, 'Hello world');
  assert.equal(item.url, 'https://news.ycombinator.com/item?id=7');
});

test('deduplicates hits returned by multiple searches', async () => {
  const fetchImpl = async () => ({ ok:true, json:async () => ({ hits:[{ objectID:'1', title:'One', created_at:'2026-08-01T00:00:00Z' }] }) });
  const items = await collectFromHackerNews({ queries:['one','two'], fetchImpl });
  assert.equal(items.length, 1);
});
