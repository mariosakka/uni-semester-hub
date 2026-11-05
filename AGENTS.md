# Agent instructions (Claude Code, Codex and other coding agents)

Vue 3 + Vite site, one folder per feature (see README "How the code is organised"). Data sets live in `public/data/<set>/data.js`.

## Release workflow (standing instruction from the maintainer)
- When asked to "push" / "commit and push": commit, push to `main` (this deploys GitHub Pages), wait for the Pages and Release Please runs of that commit, then merge the Release Please PR yourself (`gh pr merge <n> --squash --delete-branch`), `git pull --rebase`, and wait for the deploy of the release commit. Do this without asking again.
- Use the `gh` CLI, not raw API calls, for GitHub operations.
- Commit author is the GitHub noreply address already configured; never commit the faculty email.

## Checks before every push
- `npm test` and `npm run build` pass.
- Scan published files for words that must never appear: chat, whatsapp, classmate, secondhand, telegram, zoom, passcodes, phone numbers, personal/faculty email addresses.
- UI text only through `t()` (src/lib/strings.js); regenerate `docs/STRINGS.md` with `node scripts/gen-strings-doc.mjs`.

## Content rules for the published data
- No WhatsApp or invite links, meeting links with passcodes, personal phone numbers or student names.
- Tasks already on Moodle (weekly homework uploads) are not shown; real deadlines not on Moodle stay on the calendar. Schedule changes go to the news/schedule/calendar, not to the To-Do.
- Never mention where information came from (no group chats).

## Testing in the browser
- Serve `dist/` on a free port and stop the server afterwards (netstat + taskkill). Use a different origin or `cache: "reload"` to avoid stale scripts.
