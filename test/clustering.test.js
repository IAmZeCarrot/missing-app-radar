import test from 'node:test';
import assert from 'node:assert/strict';
import { applyReviewGroups, clusterRequests, deduplicateRequests, similarity } from '../src/clustering.js';

const request = (id, title, excerpt = '') => ({ id, title, excerpt, createdAt:'2026-08-01T00:00:00Z', points:2, comments:1, source:'Hacker News', url:`https://example.com/${id}` });
test('measures token overlap', () => assert.ok(similarity(request('1','private local file organizer'), request('2','local file organization tool')) > 0.2));
test('removes near-duplicate requests', () => assert.equal(deduplicateRequests([request('1','private local file organizer'), request('2','private local file organizer')]).length, 1));
test('creates scored clusters with evidence', () => { const clusters = clusterRequests([request('1','private local file organizer'), request('2','local file organization tool')], 0.1); assert.equal(clusters[0].requests, 2); assert.equal(clusters[0].evidence.length, 2); assert.ok(clusters[0].score > 0); });
test('applies explicit reviewer groups without double counting', () => { const items=[request('1','private local file organizer'),request('2','local file organization tool'),request('3','meal planning calendar')]; const result=applyReviewGroups(items,[{id:'file-tools',title:'Reviewed file tools',requestIds:['1','2']}]); assert.equal(result.reviewed[0].title,'Reviewed file tools'); assert.equal(result.reviewed[0].reviewStatus,'reviewed'); assert.deepEqual(result.remaining.map((item)=>item.id),['3']); });
