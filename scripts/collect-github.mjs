import { readFile, writeFile } from 'node:fs/promises';
import { collectFromGitHub } from '../src/github-collector.js';

const config = JSON.parse(await readFile('config/sources.json', 'utf8'));
const items = config.github.enabled ? await collectFromGitHub({ queries:config.github.queries, token:process.env.GITHUB_TOKEN || '' }) : [];
await writeFile('data/github-requests.json', `${JSON.stringify({ collectedAt:new Date().toISOString(), source:'GitHub Issues Search API', items }, null, 2)}\n`);
console.log(`Collected ${items.length} unique GitHub issues.`);
