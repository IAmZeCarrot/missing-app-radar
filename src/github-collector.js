const API_URL = 'https://api.github.com/search/issues';

export function buildGitHubSearchUrl(query, { perPage = 30 } = {}) {
  const params = new URLSearchParams({ q:`${query} is:issue is:open`, sort:'created', order:'desc', per_page:String(perPage) });
  return `${API_URL}?${params}`;
}

export function normalizeGitHubIssue(issue, query) {
  if (!issue?.id || !issue?.html_url || !issue?.title) return null;
  return { id:`github-${issue.id}`, source:'GitHub', title:issue.title, excerpt:(issue.body || '').replace(/\s+/g, ' ').slice(0, 280), author:issue.user?.login || 'unknown', createdAt:issue.created_at, points:issue.reactions?.total_count || 0, comments:issue.comments || 0, matchedQuery:query, url:issue.html_url };
}

export async function collectFromGitHub({ queries, token = '', fetchImpl = fetch } = {}) {
  const headers = { Accept:'application/vnd.github+json', 'X-GitHub-Api-Version':'2022-11-28', 'User-Agent':'missing-app-radar' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const batches = [];
  for (const query of queries || []) {
    const response = await fetchImpl(buildGitHubSearchUrl(query), { headers });
    if (!response.ok) throw new Error(`GitHub search failed with ${response.status}`);
    const data = await response.json();
    batches.push(data.items.map((issue) => normalizeGitHubIssue(issue, query)).filter(Boolean));
  }
  return [...new Map(batches.flat().map((item) => [item.id, item])).values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
