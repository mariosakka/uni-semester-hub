# Agent instructions (Claude Code, Codex and other coding agents)

Vue 3 + Vite site, one folder per feature (see README "How the code is organised"). Data sets live in `public/data/<set>/data.js`.

## Release workflow (standing instruction from the maintainer)
- When asked to "push" / "commit and push": commit, push to `main` (this deploys GitHub Pages), wait for the Pages and Release Please runs of that commit, then merge the Release Please PR yourself (`gh pr merge <n> --squash --delete-branch`), `git pull --rebase`, and wait for the deploy of the release commit. Do this without asking again.
- Use the `gh` CLI, not raw API calls, for GitHub operations.
- Commit author is the GitHub noreply address already configured; never commit the faculty email.

## Code conventions (Vue 3)
- `<script setup>` (Composition API) only; block order script, template, style; macros first. No Options API, no `this`.
- Props with runtime types and defaults (`defineProps`), kebab-case in templates; events declared with `defineEmits`; never mutate props.
- Shared logic lives in composables, one per file, `src/composables/use<Name>.js` (`useHub`, `useModal`, `useSubgroupSync`, `useScheduleTarget`, ...). Provide/inject with Symbol keys (`src/injection.js`), consumed through `useHub()`.
- Pure domain logic (dates, semester, schedule, calendar, plan, tabs, strings) stays in `src/lib/` without Vue imports. Components are thin; derived state is `computed`; side effects have cleanup.
- Direct DOM access only where Vue cannot (focus, ResizeObserver, scroll lock), wrapped in a composable. No private fields stuck on data objects.
- `v-html` only through `<RichText>` (trusted data HTML); `:key` on every `v-for`.
- Per-feature folders: `src/components/<feature>/`, `src/styles/<feature>.css` (unscoped, imported by the feature's top component).
- Tests: Vitest, `src/**/*.test.js`, importing real modules; component tests with `@vue/test-utils` (`// @vitest-environment happy-dom`).

## Checks before every push
- `npm run check` (lint, unit tests, data validators, build) passes.
- Scan published files for words that must never appear: chat, whatsapp, classmate, secondhand, telegram, zoom, passcodes, phone numbers, personal/faculty email addresses.
- UI text only through `t()` (src/lib/strings.js); regenerate `docs/STRINGS.md` with `node scripts/gen-strings-doc.mjs`.

## Content rules for the published data
- No WhatsApp or invite links, meeting links with passcodes, personal phone numbers or student names.
- Tasks already on Moodle (weekly homework uploads) are not shown; real deadlines not on Moodle stay on the calendar. Schedule changes go to the news/schedule/calendar, not to the To-Do.
- Never mention where information came from (no group chats).

## Testing in the browser
- Serve `dist/` on a free port and stop the server afterwards (netstat + taskkill). Use a different origin or `cache: "reload"` to avoid stale scripts.
