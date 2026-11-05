# Data schema (contract for `data/<set>/data.js`)

A *data set* is one file, `data/<set>/data.js`, that assigns `window.HUB_DATA = { ... }`. The site (static, no build, works from `file://`) loads the set named by `?set=<name>` (default `sample`) by injecting a `<script src="data/<name>/data.js">`. Everything about a programme/semester lives in that file; the engine in `src/` knows nothing about any specific university.

Dates are `"YYYY-MM-DD"` strings. Days are `0`=Mon … `4`=Fri. Hours are numbers (`17`, `18.5`). Item strings may contain trusted HTML (the data author is trusted; never load data sets you didn't write).

```js
window.HUB_DATA = {
  meta: {
    title: "Programme hub",            // page <h1>
    university: "…", programme: "…", academicYear: "2026–2027", semester: "Semester 1",
    calendarFilename: "my-timetable"    // .ics file name (no extension)
  },

  weeks: { segments: [ { start: "2026-09-28", count: 12 }, { start: "2027-01-11", count: 2 } ] },
  // Week numbers run consecutively through the segments (week 1 = first Monday). Gaps = vacation.

  courses: [ {
    id: "ml", title: "Applied Machine Learning", short: "AML", color: "green",  // color key: red|violet|amber|green|blue|teal|pink|grey
    ects: 5, evaluation: "E",            // E exam, V continuous/verification, P project, … (free text)
    teachers: [ { name: "…", role: "course" } ]
  } ],

  timetable: [ {
    course: "ml", type: "course",        // course | lab | project | seminar
    day: 3, start: 17, end: 19,
    teacher: "…", room: "CB205",
    group: null,                          // null = everyone, else "1"/"2": shown only for the subgroup the user selected for that course in the Schedule tab's Subgroups panel (all subgroups by default)
    parity: null,                         // null | "even" | "odd" (by week number)
    rules: [ { weeks: [[1,4],[13,14]], mode: "in-person" },
             { weeks: [[5,12]],        mode: "online" } ]   // weeks not covered by any rule: not held. A rule may add room.
  } ],

  daysOff: { "2026-11-30": "Day off (university calendar)" },

  deviations: [ {                          // dated changes to the base timetable, highlighted in the grid
    date: "2026-11-04", course: "hc", type: "lab",   // type optional: omit = applies to every session of the course that day
    change: "cancel",                      // cancel | online | in-person | note
    note: "No class (teacher reminder)", unconfirmed: false   // unconfirmed = not yet confirmed by the teacher or faculty
  } ],

  extraSessions: [ { date: "2026-11-04", start: 18, end: 20, course: "de", type: "lab",
                     teacher: "…", mode: "online", room: "", note: "…" } ],

  calendar: {
    periods: [ { from: "2026-09-28", to: "2026-12-18", kind: "teach", label: "Teaching" } ],  // kind: teach|vac|exam|break
    daysOff: "use top-level daysOff",
    semesters: [ { id: 1, name: "Semester 1", months: [[2026,8],[2026,9]], note: "html" } ],  // months: [year, month0]
    image: "calendar.png", pdf: "calendar.pdf"            // optional official calendar picture/PDF, paths relative to data/<set>/ (e.g. "assets/calendar.png")
  },


  sections: [                              // rendered top to bottom, in this order
    { kind: "list",     title: "Administrative", pinned: true, items: [ "[ ] tickable item", "plain item" ] },
    { kind: "schedule", title: "Weekly schedule" },                  // built-in: weekly grid + week picker + .ics export
    { kind: "calendar", title: "Academic calendar" },                // built-in: week / month / year views with day popups
    { kind: "course",   course: "ml", items: [ "…" ] },              // header (teachers, ECTS, evaluation) + items
    { kind: "contacts", title: "Contacts", items: [ { name: "…", role: "…", email: "…", phone: "…", note: "…" } ] },
    { kind: "links",    title: "Useful links", items: [ { label: "…", url: "https://…", note: "…" } ] },
    { kind: "table",    title: "Study plan", columns: ["Subject","ECTS","Eval."], rows: [ ["…", 5, "E"] ] },
    { kind: "list",     title: "Do now", highlight: true, items: [ … ] }   // highlight = orange accent; pinned = also exempt from the filter box
  ]
};
```

Rules the engine must follow:
- Tickable items (`"[ ] …"`) persist in `localStorage` keyed by `<set>:<section index or id>:<item index>`; give sections an optional `id` to keep ticks stable when reordering.
- A set may omit any optional key; missing pieces just don't render.
- The filter box hides non-matching list items; `schedule`, `calendar` and sections with `pinned: true` stay visible.
- Colours come from CSS classes `c-<color>`; light and dark mode both supported.
- No network requests, no external fonts/CDNs. Only `data/<set>/data.js` is loaded dynamically.

## Tabs

The page shows one tab at a time (URL hash, e.g. `#schedule`, so tabs can be bookmarked). Each section goes to a tab by its optional `tab` id; without it, by kind (see "News and To-Do tabs" and "v2.1" below for the full default mapping). Empty tabs are hidden.

To define your own, add a top-level `tabs: [ { id: "admin", title: "Admin" }, … ]` and put `tab: "admin"` on sections. Sections with an unknown or missing tab in a custom list fall into the first tab. While the filter box has text, matches from every tab are shown.

## v2: programme → years → semesters (authoritative for new data sets)

A data set describes a whole programme. Content that changes per semester lives in a semester; years just group semesters.

```js
window.HUB_DATA = {
  meta: { title, university, programme, calendarFilename },   // programme-wide
  common: [ /* sections shown in every semester (e.g. Administrative, contacts); same shape as `sections` */ ],
  years: [ {
    id: "y1", title: "Year 1 · 2026–2027",
    semesters: [ {
      id: "y1s1",                       // unique across the whole data set; used in the URL hash: #y1s1/schedule
      title: "Semester 1",
      weeks: { segments: [ { start: "2026-09-28", count: 12 }, … ] },   // omit for a semester without a timetable yet
      courses: [ … ], timetable: [ … ], daysOff: {…}, deviations: […], extraSessions: […],   // same shapes as above
      calendar: { periods: [ … ], months: [[2026,8],[2026,9],…], note: "html", image: "calendar.png", pdf: "calendar.pdf" },
      keyDates: [ { from: "2026-12-01", to: "2026-12-01", kind: "task", label: "Topic chosen" } ],   // deadlines (task) and exams/presentations (exam), see below
      tabs: [ … ],                      // optional, see Tabs
      sections: [ … ]                   // this semester's sections (kinds as above; course sections refer to this semester's courses)
    } ]
  } ]
};
```

- **Per-semester calendar:** one `calendar` object per semester (a single month list, no inner `semesters` array). `image`/`pdf` are relative to `data/<set>/`.
- **Automatic semester:** semesters are ordered by the start of `weeks.segments[0]` (or, with no weeks, by `calendar.periods[0].from`). The active one is the last semester whose start is ≤ today; before the first it is the first, after the last it is the last. A semester with neither weeks nor periods is never auto-selected. The user can pick any semester; the choice lives in the URL hash (`#<semesterId>/<tab>`), so links and reloads keep it. With no hash, the automatic one opens.
- **Navigation:** a sidebar (an off-canvas drawer on phones): logos and title at the top, search, the tabs of the selected semester, and at the bottom a **Year** select (hidden when there is only one year) and a **Semester** select for that year (the automatic one reads "… · now"). Changing either goes through the URL hash.
- **Common sections:** `common` sections are prepended to every semester's sections (so Administrative info is written once). Tick state is stored per semester for semester sections and shared for `common` ones.
- **Course ids** only need to be unique inside a semester.
- **Legacy flat shape** (the `meta/weeks/courses/timetable/…/sections` layout above, no `years`) is still accepted: the engine wraps it into one year with one semester, using `meta.academicYear` / `meta.semester` as titles. A legacy `calendar.semesters` list is ignored in v2.
- A semester may be a placeholder: only `id`, `title` and some `sections` (e.g. the subject list from the study plan). It then shows just those sections; the schedule and calendar sections are omitted automatically when there is no `weeks`/`calendar`.

## v2.1: study plan, grading and contacts

**Course objects** (each semester's `courses`; placeholder semesters may contain *only* `courses` to describe the study plan):
```js
{ id, title, short, color, ects: 5, evaluation: "E",          // E exam, V continuous/verification, P project, … free text
  description: "One or two plain-text sentences about the subject",   // optional; shown under the subject title in the Study plan
  hours: { course: 1, seminar: 0, lab: 2, project: 0 },        // hours per week, optional
  teachers: [ { name, role, email, phone, note } ],            // also the subject's main contacts
  contacts: [ { name, role, email, phone, note } ],            // extra subject contacts (assistants, guests, platform admins), optional
  grading: {                                                    // optional; never invent numbers – use notes for unverified claims
    components: [ { name: "Final exam", weight: 60, note: "" }, … ],   // weight in %, optional per component
    passRule: "free text", notes: "free text, e.g. 'solo project 7% (unconfirmed)'"
  },
  links: [ { label, url } ] }                                  // course page, Moodle, repo, …
```

**New built-in section kinds** (no items needed, they read the data):
- `{ kind: "studyplan", title: "Study plan" }` → default tab `plan` ("Study plan"). Shows **only the selected semester** (switch semester with the Semester select): a stat strip (total ECTS, subjects, exams, continuous evaluation, other, hours per week; partial totals show "≥N", unknown "–") and a colour-coded table, one row per subject in its course colour: title with the optional `description`, ECTS (pill and bar), evaluation badge (E exam / V continuous / P project / other), weekly hours chips, grading chips and teachers (names and roles only – no emails, phones or links). Each row expands to the grading components (weights with a total check), pass rule and notes. Below 1100px wide the table becomes stacked cards. Course `links` and `contacts` are not shown here (see the Courses and Contacts tabs).
- `{ kind: "directory", title: "Contacts" }` → default tab `contacts` ("Contacts"). Builds one directory: first the programme contacts (`common` sections of kind `contacts`, plus this semester's `contacts` sections), then "by subject" – each course's teachers and `contacts`, grouped under the course title. Emails/phones are links.
- The existing `contacts` section kind still works for hand-written lists; `course` sections additionally show the course's contacts and grading summary under the header line.

Section → default tab (the full default tab list is in "News and To-Do tabs" below): `studyplan` → `plan`, `directory` → `contacts`, `contacts` (hand-written) → `contacts`; `links`/`table` stay in `info`.

## Footer, author and logos (meta)

```js
meta: {
  author: { name: "Your Name", url: "https://github.com/you" },        // url optional
  programmeLine: "AI for Engineering (AIE) Master · FILS – UPB, 2026–2028",   // optional; falls back to meta.programme
  logos: [ { src: "logos/upb.png", alt: "UNSTPB Politehnica București", url: "https://upb.ro", bg: "#14233c" } ],  // src relative to data/<set>/; bg optional (for logos with white artwork)
  disclaimer: "Unofficial student-made page; the faculty's website and secretariat are authoritative."   // optional
}
```
The same logo row is shown at the **top of the sidebar** (and the top of the phone drawer) and in the footer (each logo linked if `url`, given the `bg` badge if set); the footer also has the programme line, "Made by <author>" and the disclaimer. Nothing is shown for keys that are absent.

**Default data set:** `index.html` has `<meta name="hub-default-set" content="aie">`; that set opens when the URL has no `?set=`. Without the meta tag the default is `sample`.

Calendar rendering note: period kinds `vac` and `break` are drawn exactly like `daysOff` (one hatched "Vacation / day off" style); `teach` and `exam` keep their own colours.

## News and To-Do tabs (replaces the old "Overview" tab)

Default tabs are now: **News**, **To-Do**, Schedule, Calendar, Courses, Study plan, Contacts, Info (empty ones hidden; the first non-empty one is the landing tab). The `overview` tab id is gone; a section that still says `tab: "overview"` is treated as `news`.

- **Default placement of `list` sections:** a list that has any tickable item (`"[ ] …"`) or `highlight: true` goes to **To-Do**; every other list goes to **News**. Set `tab: "news"` / `tab: "todo"` on a section to override.
- **New section kind `news`** → default tab `news`. A dated feed, newest first:
  ```js
  { kind: "news", title: "Announcements", items: [
    { date: "2026-11-03", title: "No Human-Centric AI class on 4 Nov",
      text: "html, optional – details, links",
      source: "official",            // free label shown as a tag: "official", "teacher", "secretariat", "student", …
      unconfirmed: false,            // true → shown with a "?" / "unconfirmed" marker
      course: "hc" } ] }             // optional course id: shows the course's colour/short name as a tag
  ```
  Items sort by `date` descending (ties keep file order). Each shows the date as a badge, the title in bold, then `text`, then the tags. Items with a date in the last 7 days get a "new" badge. The filter box searches news items like list items.
- Typical split: **News** = only the dated announcements feed (`kind: "news"`); **To-Do** = tickable tasks and deadlines (including "Do now" and research-topic deadlines); **Info** = administrative notes (cards, certificates, rooms, faculty pages), contacts and useful links.

Sections that describe administrative information (cards, certificates, rooms, faculty pages) are ordinary `list` sections placed on the Info tab with `tab: "info"`; the News tab is meant for the dated `news` feed only.

## Deadlines and exams on the calendar (`keyDates`)

Per semester: `keyDates: [ { from, to?, kind: "task"|"exam", label } ]`. They are drawn as markers on the Calendar tab (orange outline = deadline, red outline = exam / presentation; week, month and year views, the year view merges all semesters of the year), explained in the calendar legend, and listed under "Deadlines" in the day popup. There is no separate text list. Use it for one-off real deadlines (dissertation topic, project submissions, exams, presentations), not for recurring tasks your learning platform already tracks.

## To-Do cards (list items)

Items of a `list` section are a string or an object:

```js
"[ ] Tickable card without details",          // string: "[ ] title" = tickable, any other text = note card
"Plain note card",
{ title: "Upload enrolment documents",         // plain text or html
  text: "html details shown when the card is expanded (optional)",
  due: "15 Oct",                               // short text shown as a badge next to the title (optional)
  check: true,                                 // true = tickable (default false = note card)
  open: false }                                // true = starts expanded (never for a ticked card)
```

On the **To-Do tab** every item of every list becomes its own card: `[checkbox] [title + due badge] [chevron]`, details below. Ticking a card collapses it, ticked cards start collapsed on load, a card without `text` has no chevron, the user can open any card by hand (state is not saved). The section heading shows a progress count ("1 / 2 done") when the list has tickable items. Ticks are saved under `${section id (or index)}:${item index}`, the same keys as plain lists, so reordering items still moves ticks. Lists on other tabs keep the plain look; an object item there shows title, badge and details.
