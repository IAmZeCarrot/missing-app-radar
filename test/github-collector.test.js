import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGitHubSearchUrl, collectFromGitHub, normalizeGitHubIssue } from '../src/github-collector.js';

test('builds an open issue search', () => { const url = new URL(buildGitHubSearchUrl('feature request')); assert.match(url.searchParams.get('q'), /is:issue is:open/); });
test('normalizes GitHub issues', () => { const item = normalizeGitHubIssue({ id:7, html_url:'https://github.com/a/b/issues/1', title:'Need export', body:'Please add CSV', user:{login:'sam'}, created_at:'2026-08-01', comments:3, reactions:{total_count:2} }, 'export'); assert.equal(item.id, 'github-7'); assert.equal(item.points, 2); });
test('deduplicates GitHub results', async () => { const issue={ id:7, html_url:'https://github.com/a/b/issues/1', title:'Need export', created_at:'2026-08-01' }; const fetchImpl=async()=>({ ok:true, json:async()=>({items:[issue]}) }); const items=await collectFromGitHub({queries:['one','two'],fetchImpl}); assert.equal(items.length,1); });
