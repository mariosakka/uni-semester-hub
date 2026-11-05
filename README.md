# uni-hub

[![Deploy to GitHub Pages](https://github.com/mariosakka/uni-semester-hub/actions/workflows/pages.yml/badge.svg)](https://github.com/mariosakka/uni-semester-hub/actions/workflows/pages.yml)
[![Latest release](https://img.shields.io/github/v/release/mariosakka/uni-semester-hub?include_prereleases&sort=semver)](https://github.com/mariosakka/uni-semester-hub/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Links

| | |
|---|---|
| Live site | <https://mariosakka.github.io/uni-semester-hub/> |
| Sample data set (fictional programme) | <https://mariosakka.github.io/uni-semester-hub/?set=sample> |
| Source code | <https://github.com/mariosakka/uni-semester-hub> |
| Releases and changelog | <https://github.com/mariosakka/uni-semester-hub/releases> · [CHANGELOG.md](CHANGELOG.md) |
| Report a problem or idea | <https://github.com/mariosakka/uni-semester-hub/issues> |
| Data format | [docs/SCHEMA.md](docs/SCHEMA.md) |
| New semester, year or programme | [docs/REUSE.md](docs/REUSE.md) |
| All UI strings (translate / reword) | [docs/STRINGS.md](docs/STRINGS.md) |
| Contributing | [CONTRIBUTING.md](CONTRIBUTING.md) |

A reusable, static "university programme hub": years and semesters of a whole programme, each with a weekly timetable (with dated deviations such as cancelled or online sessions), an academic calendar, per-course sections and tickable checklists. All content comes from one data file, `data/<set>/data.js`; the engine knows nothing about any specific university. No build step, no dependencies, no network requests.

> Screenshot: _placeholder, add `docs/screenshot.png` and link it here._

## Years, semesters and tabs

A data set describes a whole programme: years contain semesters. A sidebar (a drawer on phones) lists the tabs of the selected semester, and below them a **Year** select (hidden if there is only one year) and a **Semester** select pick what you are looking at. Semester titles restart every year (Year 2 has its own "Semester 1"), so ids, not titles, identify a semester.

- **Automatic semester:** it opens on the semester that is running today (marked "now"); pick any other with the selects.
- **Links:** the choice lives in the URL hash, e.g. `#y1s2/schedule` (semester id, then tab), so links and reloads keep it.
- **Tabs:** News, To-Do, Schedule, Calendar, Courses, Study plan, Contacts, Info, chosen automatically from the section kinds; override with `tabs` and a per-section `tab`. Empty tabs are hidden.
- **News vs To-Do:** announcements and notices go in `news` sections (a dated feed, newest first, with source, "unconfirmed" and course tags, and a "new" badge for the last 7 days). A list with tickable items (`"[ ] …"`) or `highlight: true` lands in To-Do; any other list lands in News. Set `tab` to override. The old `overview` tab name is treated as News.
- **Study plan tab** (`studyplan` section): the selected semester only, as a stat strip (credits, subjects, exams, hours) and a colour-coded table of subjects with an optional `description`, ECTS, evaluation, weekly hours, grading and teachers; rows expand to the grading details. No links or emails here.
- **Contacts tab** (`directory` section): programme contacts first, then every subject's teachers and contacts. Fill `courses[].grading`, `hours`, `teachers`, `contacts` and `links`; never invent numbers, put unverified claims in `grading.notes`.
- **Placeholders:** a future semester can hold just a title and a subject list until its timetable exists.
- **Sample set:** `data/sample/` is a fictional multi-year programme showing all of this.

See [docs/SCHEMA.md](docs/SCHEMA.md) for the format.

## Features

- Weekly grid with week picker, parity (odd/even weeks), subgroups, in-person/online modes per week range
- Deviations (cancel / online / in-person / note) and extra sessions highlighted on the grid
- Academic calendar: teaching, vacation, exam periods, days off
- Per-course sections, contacts, links, tables, checklists (ticks saved in `localStorage`)
- Filter box, light and dark mode, `.ics` export
- Works from `file://`

## Quick start

Open `index.html` in a browser, or serve the folder:

```
python -m http.server 8000
```

Then visit `http://localhost:8000/`. Pick a data set with the `set` parameter: `index.html?set=sample`. Without it, the set named in `<meta name="hub-default-set">` of `index.html` opens (here `aie`; a fresh fork should point it at `sample` or its own set). Jump to a semester and tab with the hash: `index.html?set=sample#y1s2/schedule`.

## Make your own data set

1. Copy `data/sample/` to `data/<yourset>/`.
2. Edit `data/<yourset>/data.js` (format: [docs/SCHEMA.md](docs/SCHEMA.md)).
3. Validate: `node scripts/validate.mjs data/<yourset>/data.js` (Node 18+, no install needed).
4. Open `index.html?set=<yourset>`.

New semester, new year or another programme: see [docs/REUSE.md](docs/REUSE.md).

## Keep your real data private

`.gitignore` ignores everything in `data/` except `data/sample/` and the published `data/aie/` set of this repo, so other sets never get committed by accident. In a fork, remove `!data/aie/` from `.gitignore` (and `data/aie/`) before adding your own data. Alternatives: keep a private fork with your set committed, or keep the data folder outside the repo and copy it in locally. Never put invite or meeting links, phone numbers or personal names in a published set.

## Deploy to GitHub Pages

Push to `main`, then in the repository go to Settings, Pages, Source: GitHub Actions. `.github/workflows/pages.yml` publishes the repo root. The root opens the default set from `index.html` (`aie` here); `?set=sample` shows the fictional sample. For a private hub, deploy from a private fork and be aware Pages sites are public unless your plan supports private Pages.

## Layout

```
index.html            entry page
src/                  engine (rendering, styles, ics export)
data/sample/data.js   sample data set (tracked); data/aie/ is the published set of this repo, other sets are gitignored
fonts/                self-hosted Inter (latin + latin-ext) and its license
data/<set>/assets/    optional calendar image/PDF for a set
docs/SCHEMA.md        data format contract
docs/REUSE.md         guide: new semester/year, other programmes
scripts/validate.mjs  data validator (--selftest for its own check)
.github/workflows/    Pages deployment and Release Please
CHANGELOG.md          generated by Release Please
```

## Limitations

- Static snapshot: nothing updates itself; deviations are added by hand.
- Data is hand-edited JavaScript, there is no editor UI.
- `.ics` times are saved as floating local time (no timezone), so calendar apps interpret them in the device's zone.
- Data strings may contain HTML and are trusted. Only load data sets you wrote yourself.

## Fonts

Text uses [Inter](https://github.com/rsms/inter) (variable, weights 100–900), self-hosted in `fonts/` as the `latin` and `latin-ext` woff2 subsets from `@fontsource-variable/inter` 5.3.0; `latin-ext` loads only when a page contains characters such as ă ș ț. No font requests leave the site; if the files fail to load, the system UI font is used. Typography and spacing live in `src/typography.css` (loaded after `src/style.css`). Inter is licensed under the SIL Open Font License 1.1, see [fonts/OFL.txt](fonts/OFL.txt).

## License

MIT, see [LICENSE](LICENSE) (code). The bundled Inter font is under the SIL OFL 1.1, see [fonts/OFL.txt](fonts/OFL.txt).

## Releases

Releases are automated with [Release Please](https://github.com/googleapis/release-please): commits on `main` that follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `ci:`, `chore:` ...) are collected into a "release PR" that updates `CHANGELOG.md` and the version. Merging that PR creates the tag and the GitHub release, and a link section (live site, sample, docs) is added to the release notes. Until the first `feat:` or `fix:` commit lands, no release PR is opened.
