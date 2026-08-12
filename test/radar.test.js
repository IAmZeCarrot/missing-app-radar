import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateScore, calculateScoreBreakdown, filterSignals, sortSignals, toCsv } from '../src/radar.js';

const sample = [
  { title:'Alpha', summary:'Local files', category:'Tools', tags:['privacy'], effort:'Small', requests:10, latestSignal:new Date().toISOString(), pain:4, whitespace:3 },
  { title:'Beta', summary:'Shared lists', category:'Home', tags:['sync'], effort:'Large', requests:30, latestSignal:'2020-01-01', pain:5, whitespace:5 }
];

test('scores stay within the 0–100 range', () => sample.forEach((item) => assert.ok(calculateScore(item) >= 0 && calculateScore(item) <= 100)));
test('exposes auditable score components', () => { const score=calculateScoreBreakdown(sample[0],new Date(sample[0].latestSignal).getTime()); assert.deepEqual(score.weights,{volume:40,recency:25,pain:20,whitespace:15}); assert.equal(score.total,score.volume+score.recency+score.pain+score.whitespace); });
test('filters across title, summary and tags', () => assert.equal(filterSignals(sample,{query:'privacy',category:'all',effort:'all'})[0].title,'Alpha'));
test('combines category and effort filters', () => assert.deepEqual(filterSignals(sample,{query:'',category:'Home',effort:'Large'}).map(x=>x.title),['Beta']));
test('sorts by request count without mutating input', () => { const sorted=sortSignals(sample,'requests'); assert.equal(sorted[0].title,'Beta'); assert.equal(sample[0].title,'Alpha'); });
test('exports escaped CSV', () => { const csv=toCsv([{...sample[0],title:'A, "tool"'}]); assert.match(csv,/"A, ""tool"""/); });
