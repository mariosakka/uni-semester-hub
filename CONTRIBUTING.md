# Contributing

## Privacy rule

Never commit real names, phone numbers, email addresses, invite links or meeting links (Zoom, Meet, Teams, ...), in code, data, issues or screenshots. Only `data/sample/` is tracked and it must contain fictional placeholders.

## Before opening a PR

- `node scripts/validate.mjs data/sample/data.js` passes
- `node scripts/validate.mjs --selftest` passes
- Open `index.html` from `file://` and check light and dark mode
- No build tools, no runtime dependencies, no network requests

## Proposing a new section kind

Open an issue first with: the kind name, its fields (follow the style of the existing kinds in [docs/SCHEMA.md](docs/SCHEMA.md)), a small data example, and why existing kinds (`list`, `table`, `links`, ...) do not fit. In the PR, update `docs/SCHEMA.md`, the renderer in `src/`, the `KINDS` list in `scripts/validate.mjs` (it validates both the legacy and the years/semesters shapes), and add an example to the sample data.
