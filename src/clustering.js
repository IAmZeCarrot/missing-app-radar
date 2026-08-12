const STOP_WORDS = new Set('a an and are as at be by can do for from has have how i in is it me my of on or that the this to tool using want was what when where which who with would you your'.split(' '));

export function tokenize(request) {
  return new Set(`${request.title || ''} ${request.excerpt || ''}`.toLowerCase().replace(/https?:\/\/\S+/g, ' ').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((word) => word.length > 2 && !STOP_WORDS.has(word)));
}

export function similarity(left, right) {
  const a = tokenize(left); const b = tokenize(right);
  if (!a.size || !b.size) return 0;
  const overlap = [...a].filter((word) => b.has(word)).length;
  return overlap / new Set([...a, ...b]).size;
}

export function deduplicateRequests(requests, threshold = 0.72) {
  const kept = [];
  for (const request of requests) if (!kept.some((candidate) => similarity(request, candidate) >= threshold)) kept.push(request);
  return kept;
}

export function clusterRequests(requests, threshold = 0.18) {
  const clusters = [];
  for (const request of deduplicateRequests(requests)) {
    let best = null; let bestScore = threshold;
    for (const cluster of clusters) {
      const score = Math.max(...cluster.items.map((item) => similarity(request, item)));
      if (score > bestScore) { best = cluster; bestScore = score; }
    }
    if (best) best.items.push(request); else clusters.push({ items:[request] });
  }
  return clusters.map(summarizeCluster).sort((a, b) => b.score - a.score);
}

function summarizeCluster(cluster) {
  const frequencies = new Map();
  cluster.items.forEach((item) => tokenize(item).forEach((word) => frequencies.set(word, (frequencies.get(word) || 0) + 1)));
  const keywords = [...frequencies.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([word]) => word);
  const newest = [...cluster.items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  const engagement = cluster.items.reduce((sum, item) => sum + (item.points || 0) + (item.comments || 0), 0);
  return { id:`emerging-${keywords.slice(0, 3).join('-') || newest.id}`, title:newest.title, summary:newest.excerpt || `Recent requests related to ${keywords.join(', ')}.`, score:Math.min(100, Math.round(28 + cluster.items.length * 11 + Math.log2(engagement + 1) * 7)), requests:cluster.items.length, latestSignal:newest.createdAt, keywords, evidence:cluster.items.slice(0, 8).map(({ source, title, url, createdAt }) => ({ source, label:title, url, createdAt })) };
}
