# Reusing uni-hub

One data set (`data/<set>/data.js`) holds the whole programme: `years[]` contain `semesters[]` (format: [SCHEMA.md](SCHEMA.md), section "v2"). You normally keep editing the same set instead of copying folders.

## Start a new semester

1. In the right year's `semesters`, copy the previous semester object and give it a new unique `id` (e.g. `y1s2`; it appears in the URL as `#y1s2/schedule`) and `title`.
2. `weeks.segments`: new first Monday and week counts. A gap between segments is vacation; week numbers continue across segments.
3. `courses`: update titles, teachers, ECTS, evaluation (ids only need to be unique inside the semester).
4. `timetable`: adjust each slot (day 0-4, start/end, room, parity, group) and every `rules[].weeks` range; weeks not covered by a rule are "not held".
5. `daysOff`, `calendar.periods`, `calendar.months` (`[year, month0]`), `keyDates`: replace with the new official calendar.
6. Clear `deviations` and `extraSessions` (`[]`); they are dated and only valid for the old term. Drop old per-course items and checklist items from `sections`.
7. Run `node scripts/validate.mjs data/<set>/data.js`, open the page and click through every week once.

The page opens on the semester that is running today, so nothing else needs switching.

## Start a new year

Add an object to `years`: `{ id: "y2", title: "Year 2 · 2027–2028", semesters: [ … ] }` and put its semesters inside. The Year select appears once there is more than one year. Semester titles restart each year ("Semester 1", "Semester 2"); only the ids (e.g. `y2s1`) must be unique across the data set.

## Old semesters and future ones

- Keep finished semesters in the file: they stay browsable through the Year/Semester selects and their ticks and deviations stay intact. Delete one only if you do not need it.
- Future semesters can be placeholders: just `id`, `title` and some `sections` (e.g. the subject list from the study plan). Add `weeks`, `courses`, `timetable` and `calendar` when the schedule is published; the schedule and calendar tabs appear automatically.

## News and To-Do

- The News tab is the dated announcements feed only. Administrative notes (cards, certificates, rooms, faculty pages) go in an ordinary `list` section with `tab: "info"`, next to contacts and useful links.
- Put announcements and teacher updates in a `{ kind: "news", items: [ { date, title, text, source, unconfirmed, course } ] }` section: the News tab shows them newest first, and items from the last 7 days get a "new" badge. Add a line each time something is announced instead of editing old text; mark reports not yet confirmed by the teacher or faculty with `unconfirmed: true` and `source`.
- Put tasks and deadlines in a list with tickable items (`"[ ] …"`) or `highlight: true`; it appears in the To-Do tab. Other lists go to News. Old `tab: "overview"` still works (it means News), but the validator warns.

## Study plan, grading and contacts

- The Study plan and Contacts tabs are built from `courses` (add `{ kind: "studyplan" }` and `{ kind: "directory" }` sections, usually in `common`). A placeholder semester can hold only `courses` to describe its subjects.
- Per course: `hours` (per week), `teachers`, extra `contacts`, `links`, and `grading` with `components` (`name`, `weight` in %), `passRule`, `notes`.
- Do not invent numbers. Leave out a weight you do not know; put unverified claims in `grading.notes` (e.g. "project 7%, unconfirmed"). The validator warns if weights are given but do not sum to 100.

## Programme-wide sections

Put content that applies to every semester (administrative checklist, contacts, useful links) once in the top-level `common` array. It is shown in every semester. `common` cannot hold `course` sections.

## Turning source documents into data

Timetable image or xlsx
- Read it slot by slot into one `timetable` object each. Mixed cells ("course / lab, groups 1 and 2") become several objects with `group` set.
- Cells marked "odd weeks" or "even weeks" use `parity`. Cells that change mode mid-term use several `rules` entries.
- For xlsx, export to CSV and transform it with a throwaway script; check the output by eye against the original, since merged cells are error-prone.
- An AI assistant can draft the first pass from an image. Verify every room, hour and day yourself; the validator checks structure, not truth.

Official calendar PDF
- Copy the teaching, exam and vacation date ranges into the semester's `calendar.periods`, holidays into `daysOff`, exam and deadline dates into `keyDates`.
- Count teaching weeks to fill `weeks.segments`; the number must match the official week count.
- Put the PDF or a picture in `data/<set>/` and reference it via `calendar.pdf` / `calendar.image` (paths are relative to the data set folder; do not commit it if it is not public).

## Sharing a template without private content

- Share a stripped data set: keep structure, course names and timetable if public, and remove contacts, personal notes, invite links and meeting links.
- Use placeholders (`"Teacher A"`, `"https://example.com/"`) and publish it as a `data/<name>/` folder or a gist, not your working file.
- Write deviations as short factual notes ("No class") and mark anything not confirmed by the teacher or faculty `unconfirmed: true`.
- Before sharing, search the folder for `@`, `+`, `http`, `zoom`, `meet.` and `t.me`, then run the validator.

## Branding: logos, author and footer

Set `meta.logos` (images in `data/<set>/logos/`, `bg` for logos with white artwork), `meta.author`, `meta.programmeLine` and `meta.disclaimer`. The logos appear at the top of the sidebar and in the footer; keys you leave out show nothing. Only use logos you may use, and keep the "unofficial page" disclaimer if you are not the institution.

## Which data set opens by default, and publishing

`index.html` names the default set in `<meta name="hub-default-set" content="...">`. For a fork: change it to your set (or `sample`), remove `!data/aie/` from `.gitignore` and delete `data/aie/`, then add your own. Everything tracked in git is public once GitHub Pages is on (Settings, Pages, Source: GitHub Actions), so keep invite links, meeting links, phone numbers and personal names out of any published set.

## Releases

Commits on `main` use Conventional Commits (`feat:`, `fix:`, `docs:`, `ci:`, `chore:`); Release Please opens a release PR that updates `CHANGELOG.md` and the version, and merging it publishes a GitHub release with a links section. See the README.
