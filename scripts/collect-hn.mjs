import { mkdir, writeFile } from 'node:fs/promises';
import { collectFromHackerNews } from '../src/collector.js';

const items = await collectFromHackerNews();
await mkdir('data', { recursive: true });
await writeFile('data/hn-requests.json', `${JSON.stringify({
  collectedAt: new Date().toISOString(),
  source: 'Hacker News Algolia Search API',
  items
}, null, 2)}\n`);
console.log(`Collected ${items.length} unique Hacker News requests.`);
