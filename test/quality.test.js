import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareRequests, validateRequest } from '../src/quality.js';

const request = (overrides = {}) => ({ id:'one', source:'Hacker News', title:'Need a useful app', excerpt:'Details', createdAt:'2026-08-01T00:00:00Z', url:'https://example.com/one', ...overrides });

test('rejects malformed evidence before clustering', () => {
  assert.deepEqual(validateRequest(request({ url:'javascript:alert(1)', createdAt:'yesterday' })), ['invalid-date', 'invalid-url']);
});

test('reports duplicate URLs and reviewer exclusions', () => {
  const result = prepareRequests([request(), request({ id:'two' }), request({ id:'three', url:'https://example.com/three' })], { excludedIds:['three'] });
  assert.equal(result.accepted.length, 1);
  assert.deepEqual(result.report.reasons, { 'duplicate-evidence':1, 'reviewer-excluded':1 });
});

test('rejects discussion that does not express a software request', () => {
  assert.deepEqual(validateRequest(request({ title:'Release announcement', excerpt:'Version two shipped today' })), ['low-request-intent']);
});
