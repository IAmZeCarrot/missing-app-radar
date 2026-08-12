import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSnapshot, updateHistory } from '../src/history.js';

test('builds compact daily snapshots and replaces same-day runs', () => {
  const cluster = { id:'files', score:72, requests:3, evidence:[{ source:'GitHub' }, { source:'Hacker News' }] };
  const first = buildSnapshot([cluster], '2026-08-12T10:00:00Z');
  const updated = updateHistory({ snapshots:[{ date:'2026-08-12', clusters:0 }] }, first);
  assert.equal(updated.snapshots.length, 1);
  assert.deepEqual(updated.snapshots[0], { date:'2026-08-12', clusters:1, requests:3, sources:2, topClusters:[{ id:'files', score:72, requests:3 }] });
});
