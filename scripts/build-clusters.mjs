import { readFile, writeFile } from 'node:fs/promises';
import { applyReviewGroups, clusterRequests } from '../src/clustering.js';
import { buildSnapshot, updateHistory } from '../src/history.js';
import { prepareRequests } from '../src/quality.js';

const hackerNews = JSON.parse(await readFile('data/hn-requests.json', 'utf8'));
let github = { items:[] };
try { github = JSON.parse(await readFile('data/github-requests.json', 'utf8')); } catch {}
let review = { excludedRequestIds:[], groups:[] };
let history = { snapshots:[] };
try { review = JSON.parse(await readFile('config/clustering-review.json', 'utf8')); } catch {}
try { history = JSON.parse(await readFile('data/history.json', 'utf8')); } catch {}
const generatedAt = process.env.RADAR_GENERATED_AT || new Date().toISOString();
const { accepted, report } = prepareRequests([...hackerNews.items, ...github.items], { excludedIds:review.excludedRequestIds });
const { reviewed, remaining } = applyReviewGroups(accepted, review.groups);
const automatic = clusterRequests(remaining, 0.1).filter((cluster) => cluster.requests > 1);
const clusters = [...reviewed, ...automatic].sort((a, b) => b.score - a.score).slice(0, 30);
await Promise.all([
  writeFile('data/emerging-signals.json', `${JSON.stringify({ schemaVersion:2, generatedAt, clusters }, null, 2)}\n`),
  writeFile('data/quality-report.json', `${JSON.stringify({ schemaVersion:1, generatedAt, ...report }, null, 2)}\n`),
  writeFile('data/history.json', `${JSON.stringify(updateHistory(history, buildSnapshot(clusters, generatedAt)), null, 2)}\n`)
]);
console.log(`Built ${clusters.length} clusters from ${accepted.length} accepted requests; rejected ${report.rejected}.`);
