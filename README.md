# Missing App Radar

An evidence-backed dashboard for finding recurring software requests worth building.

Missing App Radar turns scattered “I wish this existed” discussions into comparable opportunity clusters. Every idea keeps its evidence links and receives a transparent score based on request volume, recency, pain intensity, and whitespace.

## Features

- Search and filter opportunity clusters
- Transparent 0–100 signal scoring
- Original evidence links for every idea
- Suggested MVP scope
- JSON and CSV exports
- Responsive, dependency-free interface
- Automated tests for filtering, sorting, scoring, and export

## Run locally

```bash
npm run dev
```

Open <http://localhost:4173>. No installation or build step is required.

## Test

```bash
npm test
```

## Refresh Hacker News requests

```bash
npm run collect:hn
```

This queries the Hacker News Algolia Search API for recent software requests, writes a deduplicated inbox to `data/hn-requests.json`, and builds scored clusters in `data/emerging-signals.json`. The website displays the strongest emerging clusters. A scheduled GitHub Actions workflow refreshes both files daily.

Collection sources and search phrases live in `config/sources.json`, so new queries can be added without changing collector code. The refresh also searches public GitHub issues using the workflow's built-in `GITHUB_TOKEN`.

## Scoring

The score is deliberately simple and auditable:

| Signal | Weight |
| --- | ---: |
| Request volume | 40% |
| Recency | 25% |
| Pain intensity | 20% |
| Market whitespace | 15% |

The included dataset is curated seed data for demonstrating the workflow, not a statistically representative market analysis. Original links are retained so findings can be checked.

## Roadmap

- Improve clustering with semantic embeddings and human review controls
- Add GitHub Discussions GraphQL collection
- Introduce duplicate detection and semantic clustering
- Store snapshots in SQLite
- Add import adapters for RSS and user-supplied JSON
- Publish a static demo with GitHub Pages

## Contributing

New source adapters, scoring ideas, and evidence corrections are welcome. Please open an issue before making a large change.

## License

MIT
