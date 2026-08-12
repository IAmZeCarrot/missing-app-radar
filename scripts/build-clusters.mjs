import { readFile, writeFile } from 'node:fs/promises';
import { clusterRequests } from '../src/clustering.js';

const inbox = JSON.parse(await readFile('data/hn-requests.json', 'utf8'));
const clusters = clusterRequests(inbox.items).filter((cluster) => cluster.requests > 1).slice(0, 30);
await writeFile('data/emerging-signals.json', `${JSON.stringify({ generatedAt:new Date().toISOString(), clusters }, null, 2)}\n`);
console.log(`Built ${clusters.length} emerging opportunity clusters.`);
