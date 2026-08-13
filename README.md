# Missing App Radar

An evidence-backed dashboard for finding recurring software requests worth building.

Missing App Radar turns scattered “I wish this existed” discussions into comparable opportunity clusters. Every idea keeps its evidence links and receives a transparent score based on request volume, recency, pain intensity, and whitespace.

## Try it

Open the [live Missing App Radar](https://iamzecarrot.github.io/missing-app-radar/) in any modern browser. No installation, account, backend, telemetry, or paid service is required.

The interface labels automated clusters as leads, links every displayed signal to its evidence, and warns when collected data is stale or unavailable.

## Features

- Search and filter opportunity clusters
- Transparent 0–100 signal scoring
- Original evidence links for every idea
- Suggested MVP scope
- JSON and CSV exports
- Responsive, dependency-free interface
- Automated tests for filtering, sorting, scoring, and export
- Quality reports that explain every rejected record
- Reviewer-controlled cluster grouping and exclusions
- Rolling 90-day snapshots for tracking signal changes

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

This queries the Hacker News Algolia Search API for recent software requests. `npm run refresh` also runs the existing public GitHub issue collector and rebuilds the derived datasets. The scheduled workflow does this daily.

The cluster build validates required fields, dates, safe evidence URLs, and explicit request-language signals. It removes duplicate IDs and identical title/URL evidence, then honors reviewer exclusions before clustering. Multiple distinct comments may point to the same parent discussion without being discarded. Records that merely mention query words without expressing a request are kept out of clusters and explained as `low-request-intent` in the report. Outputs are:

| File | Purpose |
| --- | --- |
| `data/emerging-signals.json` | Ranked, evidence-backed automatic and reviewed clusters |
| `data/quality-report.json` | Counts and reason codes for rejected records |
| `data/history.json` | Up to 90 daily summary snapshots and top-cluster metrics |

Set `RADAR_GENERATED_AT` to an ISO timestamp when a reproducible build is needed.

## Clustering review

Automatic clusters are leads, not conclusions. Edit `config/clustering-review.json` to apply repeatable human decisions:

```json
{
  "excludedRequestIds": ["github-123"],
  "groups": [
    {
      "id": "local-file-tools",
      "title": "Local file organization",
      "summary": "Requests for private file organization workflows.",
      "requestIds": ["hn-10", "github-20"]
    }
  ]
}
```

Excluded records remain visible in the quality report with `reviewer-excluded`. Requests in a review group are removed from automatic clustering, preventing double counting. A group with no currently collected request IDs is ignored. Reviewed clusters are labeled in the interface.

Collection sources and search phrases live in `config/sources.json`, so new queries can be added without changing collector code. The refresh also searches public GitHub issues using the workflow's built-in `GITHUB_TOKEN`.

## Scoring

Curated opportunity scores are deliberately simple and auditable. The detail view shows every component:

| Signal | Weight |
| --- | ---: |
| Request volume | 40% |
| Recency | 25% |
| Pain intensity | 20% |
| Market whitespace | 15% |

The included dataset is curated seed data for demonstrating the workflow, not a statistically representative market analysis. Original links are retained so findings can be checked.

Emerging cluster scores use a separate heuristic displayed on every card: a 28-point lead baseline, up to 44 points for request volume, and up to 28 points for engagement. A high score means stronger evidence in the collected inbox, not proven demand or market size.

## Roadmap

- Add GitHub Discussions GraphQL collection
- Introduce duplicate detection and semantic clustering
- Store snapshots in SQLite
- Add import adapters for RSS and user-supplied JSON
- Add confidence-aware semantic clustering

## Data limitations

- Search phrases bias what is collected, and public community posts are not a representative market sample.
- Keyword overlap can join unrelated requests or split synonyms. Human review controls correct known cases without pretending the heuristic is semantic understanding.
- Engagement is community-specific and is not normalized across sources.
- Historical snapshots begin when this release is first run; the project does not invent backfilled history.
- GitHub API rate limits still apply. The scheduled workflow uses its standard repository token; local collection can use `GITHUB_TOKEN`.

## Deployment

Changes merged into `main` are verified and deployed through GitHub Actions. In repository settings, GitHub Pages must use **GitHub Actions** as its source.

## Contributing

New source adapters, scoring ideas, and evidence corrections are welcome. Please open an issue before making a large change.

## License

MIT
