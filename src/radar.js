export const effortRank = { Small: 1, Medium: 2, Large: 3 };

export function calculateScore(signal) {
  const volume = Math.min(signal.requests / 40, 1) * 40;
  const ageDays = Math.max(0, (Date.now() - new Date(signal.latestSignal)) / 86400000);
  const recency = Math.max(0, 1 - ageDays / 730) * 25;
  const pain = (signal.pain / 5) * 20;
  const whitespace = (signal.whitespace / 5) * 15;
  return Math.round(volume + recency + pain + whitespace);
}

export function filterSignals(signals, filters) {
  const query = filters.query.trim().toLowerCase();
  return signals.filter((signal) => {
    const haystack = [signal.title, signal.summary, signal.category, ...signal.tags].join(' ').toLowerCase();
    return (!query || haystack.includes(query)) &&
      (filters.category === 'all' || signal.category === filters.category) &&
      (filters.effort === 'all' || signal.effort === filters.effort);
  });
}

export function sortSignals(signals, sortBy) {
  return [...signals].sort((a, b) => {
    if (sortBy === 'requests') return b.requests - a.requests;
    if (sortBy === 'recent') return new Date(b.latestSignal) - new Date(a.latestSignal);
    if (sortBy === 'effort') return effortRank[a.effort] - effortRank[b.effort] || calculateScore(b) - calculateScore(a);
    return calculateScore(b) - calculateScore(a);
  });
}

export function toCsv(signals) {
  const escape = (value) => `"${String(value).replaceAll('"', '""')}"`;
  const rows = [['title', 'category', 'score', 'requests', 'effort', 'latest_signal', 'tags']];
  signals.forEach((s) => rows.push([s.title, s.category, calculateScore(s), s.requests, s.effort, s.latestSignal, s.tags.join('|')]));
  return rows.map((row) => row.map(escape).join(',')).join('\n');
}
