export function buildSnapshot(clusters, generatedAt) {
  const sources = new Set(clusters.flatMap((cluster) => cluster.evidence.map((item) => item.source)));
  return {
    date: generatedAt.slice(0, 10),
    clusters: clusters.length,
    requests: clusters.reduce((sum, cluster) => sum + cluster.requests, 0),
    sources: sources.size,
    topClusters: clusters.slice(0, 5).map(({ id, score, requests }) => ({ id, score, requests }))
  };
}

export function updateHistory(history, snapshot, limit = 90) {
  const retained = (Array.isArray(history?.snapshots) ? history.snapshots : []).filter((item) => item.date !== snapshot.date);
  return { schemaVersion:1, snapshots:[...retained, snapshot].sort((a, b) => a.date.localeCompare(b.date)).slice(-limit) };
}
