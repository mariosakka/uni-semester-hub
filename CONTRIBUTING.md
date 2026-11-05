# Contributing

## Privacy rule

Never commit real names, phone numbers, email addresses, invite links or meeting links (Zoom, Meet, Teams, ...), in code, data, issues or screenshots. `public/data/sample/` must contain fictional placeholders only. The other tracked set (`public/data/aie/`) is the maintainer's published data; keep it free of invite and meeting links, phone numbers and personal names too.

## Before opening a PR

- `node scripts/validate.mjs public/data/sample/data.js` passes
- `node scripts/validate.mjs --selftest` passes
- `npm run check` passes (ESLint with eslint-plugin-vue, Vitest, data validators, build; Node 20+; `npm run dev` for a live preview)
- Check light and dark mode, and a phone width
- Follow the Vue conventions in [AGENTS.md](AGENTS.md) (script setup, composables, typed props, `<RichText>` instead of `v-html`)
- No runtime dependencies besides Vue, no network requests

## Proposing a new section kind

Open an issue first with: the kind name, its fields (follow the style of the existing kinds in [docs/SCHEMA.md](docs/SCHEMA.md)), a small data example, and why existing kinds (`list`, `table`, `links`, ...) do not fit. In the PR, update `docs/SCHEMA.md`, the Vue component in `src/components/` (plus its pure logic in `src/lib/` and a node test), the `KINDS` list in `scripts/validate.mjs` (it validates both the legacy and the years/semesters shapes), and add an example to the sample data.

## Commit messages

Use Conventional Commits (`feat: ...`, `fix: ...`, `docs: ...`, `ci: ...`, `chore: ...`; `feat!:` or a `BREAKING CHANGE:` footer for breaking changes). Release Please reads them to pick the version and write the changelog.
