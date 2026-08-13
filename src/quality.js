const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
const REQUEST_INTENT = /\b(wish|looking for|need(?:ing)? (?:a|an)|app for|tool for|software for|feature request|please add|would be useful|is there (?:a|an)|recommend(?:ation)?|how (?:do|can) i)\b/i;

export function validateRequest(request) {
  const reasons = [];
  if (!request || typeof request !== 'object') return ['not-an-object'];
  if (!clean(request.id)) reasons.push('missing-id');
  if (!clean(request.source)) reasons.push('missing-source');
  if (clean(request.title).length < 8) reasons.push('title-too-short');
  if (!isValidDate(request.createdAt)) reasons.push('invalid-date');
  if (!isSafeUrl(request.url)) reasons.push('invalid-url');
  if (!REQUEST_INTENT.test(`${clean(request.title)} ${clean(request.excerpt)}`)) reasons.push('low-request-intent');
  return reasons;
}

export function prepareRequests(requests, { excludedIds = [] } = {}) {
  const excluded = new Set(excludedIds);
  const seenIds = new Set();
  const seenEvidence = new Set();
  const accepted = [];
  const rejected = [];

  for (const request of requests) {
    const reasons = validateRequest(request);
    const id = clean(request?.id);
    const url = canonicalUrl(request?.url);
    const evidenceKey = `${url}\n${clean(request?.title).toLowerCase()}`;
    if (excluded.has(id)) reasons.push('reviewer-excluded');
    if (seenIds.has(id)) reasons.push('duplicate-id');
    if (url && seenEvidence.has(evidenceKey)) reasons.push('duplicate-evidence');
    if (reasons.length) {
      rejected.push({ id: id || null, reasons: [...new Set(reasons)] });
      continue;
    }
    seenIds.add(id);
    seenEvidence.add(evidenceKey);
    accepted.push({ ...request, id, source:clean(request.source), title:clean(request.title), excerpt:clean(request.excerpt), url });
  }

  return {
    accepted,
    report: {
      input: requests.length,
      accepted: accepted.length,
      rejected: rejected.length,
      reasons: rejected.flatMap((item) => item.reasons).reduce((counts, reason) => ({ ...counts, [reason]:(counts[reason] || 0) + 1 }), {}),
      items: rejected
    }
  };
}

function clean(value) { return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''; }
function isValidDate(value) { return typeof value === 'string' && !Number.isNaN(Date.parse(value)); }
function isSafeUrl(value) { try { return ALLOWED_PROTOCOLS.has(new URL(value).protocol); } catch { return false; } }
function canonicalUrl(value) { try { const url = new URL(value); url.hash = ''; return url.toString(); } catch { return ''; } }
