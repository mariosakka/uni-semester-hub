/*
 * Sample data set (v2: programme -> years -> semesters): a fictional programme.
 * Copy this folder to data/<yourset>/ and edit. Load it with ?set=<yourset>.
 * See docs/SCHEMA.md ("v2") for the full contract.
 * Everything here is fake (names, rooms, example.org addresses).
 * Dates are "YYYY-MM-DD"; days are 0=Mon..4=Fri; hours are numbers (18.5 = 18:30).
 * Strings may contain trusted HTML.
 *
 * Layout:
 *   meta    - programme-wide (title, who am I, .ics name)
 *   common  - sections shown in EVERY semester (written once)
 *   years[] - just groups of semesters; each semester holds its own weeks, courses,
 *             timetable, daysOff, deviations, extraSessions, calendar, tabs, sections
 * Semester ids must be unique (they appear in the URL hash: #y1s2/schedule).
 * Courses carry hours, teachers (with email), contacts, grading and links; the built-in
 * "studyplan" and "directory" sections are built from them (a placeholder semester may hold only courses).
 * Auto-selection: semesters are ordered by the start of weeks.segments[0] (else
 * calendar.periods[0].from); the active one is the last whose start <= today. A semester
 * with neither (like the placeholder below) is never auto-selected, but can be picked by hand.
 */
window.HUB_DATA = {
  // ---- meta: programme-wide labels and "who am I" (subgroup choice) ----
  meta: {
    title: "MSc Data Science Hub",
    subtitle: "Fictional example data set - not an official source",
    university: "Example University",
    programme: "MSc Data Science",
    // default subgroup for everyone, optionally overridden per course id (ids of any semester)
    calendarFilename: "example-timetable" // .ics export name
  },

  // ---- common: programme-wide sections, prepended to every semester's sections ----
  common: [
    // tab: "info" overrides the default (tickable lists go to To-Do); the items stay tickable
    { kind: "list", id: "admin", title: "Administrative", pinned: true, tab: "info", items: [
      "[ ] Collect your student card at the registrar's office (A001)",
      "[ ] Complete enrolment and upload documents at <a href='https://portal.example.org'>portal.example.org</a>",
      "[ ] Activate your university account and email",
      "[ ] Join the course platform and the programme mailing list",
      "Office hours of the registrar: Mon-Fri 9:00-12:00"
    ] },
    { kind: "contacts", title: "Programme contacts", tab: "info", items: [
      { name: "Prof. Ada Example", role: "Programme director", email: "ada.example@example.org", phone: "+00 000 000 001", note: "Office A210" },
      { name: "Registrar (Example University)", role: "Administration", email: "registrar@example.org", note: "Mon-Fri 9:00-12:00" },
      { name: "IT helpdesk", role: "Accounts and Wi-Fi", email: "helpdesk@example.org" }
    ] },
    { kind: "links", title: "Useful links", items: [
      { label: "Student portal", url: "https://portal.example.org", note: "Enrolment, grades" },
      { label: "Course platform", url: "https://learn.example.org", note: "Slides and assignments" },
      { label: "Library", url: "https://library.example.org" }
    ] },
    // built-in sections that read the courses data of each semester
    { kind: "studyplan", title: "Study plan" },       // programme / semester / per-subject view
    { kind: "directory", title: "Contacts" }         // programme contacts (above) + teachers and contacts by subject
  ],

  years: [
    // ================= Year 1 =================
    { id: "y1", title: "Year 1 · 2027–2028", semesters: [

      // ---------- Semester 1: a full semester (everything below is per-semester) ----------
      { id: "y1s1", title: "Semester 1", subtitle: "Autumn 2027 - teaching 27 Sep to 14 Jan",
        // weeks: week numbers run consecutively through segments; gaps = vacation.
        // 12 teaching weeks, a 2-week winter break (Dec 20 - Jan 2), then weeks 13-14.
        weeks: {
          segments: [
            { start: "2027-09-27", count: 12 }, // weeks 1-12
            { start: "2028-01-03", count: 2 }   // weeks 13-14
          ]
        },

        // courses: id is referenced by this semester's timetable/deviations/sections;
        // color = red|violet|amber|green|blue|teal|pink|grey
        courses: [
          { id: "ml", title: "Applied Machine Learning", short: "AML", color: "green", description: "Supervised and unsupervised learning, model evaluation and deployment basics, with hands-on labs.", ects: 6, evaluation: "E (exam)",
            hours: { course: 2, lab: 2 },
            teachers: [ { name: "Prof. Ada Example", role: "course", email: "ada.example@example.org" }, { name: "Dr. Ben Sample", role: "lab", email: "ben.sample@example.org" } ],
            contacts: [ { name: "Zoe Assistant", role: "Lab assistant", email: "zoe.assistant@example.org", note: "Office hours Tue 12:00" } ],
            grading: { components: [ { name: "Final exam", weight: 70 }, { name: "Lab reports", weight: 30 } ],
              passRule: "At least 50% in each component" },
            links: [ { label: "Course page", url: "https://learn.example.org/aml" } ] },
          { id: "db", title: "Data Engineering", short: "DE", color: "blue", description: "Building reliable data pipelines: ingestion, storage, transformation and orchestration.", ects: 5, evaluation: "V (continuous)",
            hours: { course: 1, lab: 2 },
            teachers: [ { name: "Prof. Cara Placeholder", role: "course", email: "cara.placeholder@example.org" }, { name: "Dr. Dan Demo", role: "lab", email: "dan.demo@example.org" } ],
            grading: { components: [ { name: "Lab tasks (3)", weight: 60 }, { name: "Quiz", weight: 20 }, { name: "Final lab test", weight: 20 } ] },
            links: [ { label: "Course page", url: "https://learn.example.org/de" }, { label: "Lab repository", url: "https://git.example.org/de-labs" } ] },
          { id: "st", title: "Statistical Methods", short: "STAT", color: "amber", description: "Probability, estimation, hypothesis testing and regression for data science.", ects: 5, evaluation: "E (exam)",
            hours: { course: 2, seminar: 1 },
            teachers: [ { name: "Prof. Eli Mock", role: "course", email: "eli.mock@example.org" } ],
            grading: { components: [ { name: "Written exam", weight: 80 }, { name: "Oral", weight: 20, note: "short, after the written part" } ] } },
          { id: "vz", title: "Data Visualisation", short: "VIZ", color: "violet", description: "Designing clear, honest charts and dashboards; project-based.", ects: 4, evaluation: "P (project)",
            hours: { project: 3 },
            teachers: [ { name: "Dr. Fay Template", role: "course + project", email: "fay.template@example.org" } ],
            // notes only: no verified weights
            grading: { notes: "Team project graded on the pitch and the final submission; weights not published yet (unconfirmed)." } },
          { id: "et", title: "Ethics in Data Science", short: "ETH", color: "pink", description: "Privacy, fairness and responsible use of data; short essay assignments.", ects: 3, evaluation: "V (essay)",
            hours: { course: 2 },
            // no grading object at all: the plan simply shows no grading info
            teachers: [ { name: "Dr. Gus Fictional", role: "course", email: "gus.fictional@example.org" } ] }
        ],

        // timetable: weekly base schedule
        // group: null = all, "1"/"2" = shown only to that subgroup (each student picks theirs with the Subgroups button in the Schedule tab)
        // parity: null | "even" | "odd" (by week number)
        // rules: weeks as [from,to] ranges; weeks not covered by any rule = not held. A rule may set room.
        timetable: [
          // Course lecture, in person weeks 1-8, then online
          { course: "ml", type: "course", day: 0, start: 10, end: 12, teacher: "Prof. Ada Example", room: "A101",
            group: null, parity: null,
            rules: [ { weeks: [[1, 8]], mode: "in-person" }, { weeks: [[9, 14]], mode: "online" } ] },
          // Lab with two subgroups (same slot, different rooms)
          { course: "ml", type: "lab", day: 1, start: 14, end: 16, teacher: "Dr. Ben Sample", room: "B201",
            group: "1", parity: null, rules: [ { weeks: [[1, 14]], mode: "in-person" } ] },
          { course: "ml", type: "lab", day: 1, start: 16, end: 18, teacher: "Dr. Ben Sample", room: "B201",
            group: "2", parity: null, rules: [ { weeks: [[1, 14]], mode: "in-person" } ] },
          // Even weeks only; weeks 5-6 not covered by a rule = not held
          { course: "db", type: "course", day: 1, start: 10, end: 12, teacher: "Prof. Cara Placeholder", room: "A102",
            group: null, parity: "even",
            rules: [ { weeks: [[1, 4], [7, 14]], mode: "in-person" } ] },
          // Lab: in-person with a room override in the later weeks
          { course: "db", type: "lab", day: 2, start: 14, end: 16, teacher: "Dr. Dan Demo", room: "B202",
            group: null, parity: null,
            rules: [ { weeks: [[1, 6]], mode: "in-person" }, { weeks: [[7, 14]], mode: "in-person", room: "B305" } ] },
          { course: "st", type: "course", day: 2, start: 10, end: 12, teacher: "Prof. Eli Mock", room: "A101",
            group: null, parity: null, rules: [ { weeks: [[1, 14]], mode: "in-person" } ] },
          // Seminar-style slot with half-hour times, online only
          { course: "st", type: "seminar", day: 3, start: 17, end: 18.5, teacher: "Prof. Eli Mock", room: "",
            group: null, parity: "odd", rules: [ { weeks: [[1, 14]], mode: "online" } ] },
          // Project slot
          { course: "vz", type: "project", day: 3, start: 14, end: 17, teacher: "Dr. Fay Template", room: "C010",
            group: null, parity: null, rules: [ { weeks: [[2, 12]], mode: "in-person" } ] },
          { course: "et", type: "course", day: 4, start: 9, end: 11, teacher: "Dr. Gus Fictional", room: "A103",
            group: null, parity: null,
            rules: [ { weeks: [[1, 3], [13, 14]], mode: "in-person" }, { weeks: [[4, 12]], mode: "online" } ] }
        ],

        // daysOff: dates with no classes at all
        daysOff: {
          "2027-11-01": "Day off (example university calendar)",
          "2027-12-08": "Founders' day (fictional)"
        },

        // deviations: dated changes to the base timetable; type optional
        deviations: [
          { date: "2027-10-12", course: "ml", type: "lab", change: "cancel", note: "Lab cancelled (teacher away)", unconfirmed: false },
          { date: "2027-10-21", course: "st", change: "online", note: "Moved online for this day", unconfirmed: false },
          { date: "2027-11-09", course: "ml", type: "course", change: "in-person", note: "Guest talk, attend on site (room A101)", unconfirmed: false },
          { date: "2027-11-17", course: "db", type: "lab", change: "note", note: "Unverified: bring your laptop", unconfirmed: true }
        ],

        // extraSessions: one-off sessions not in the base timetable
        extraSessions: [
          { date: "2027-11-24", start: 18, end: 20, course: "db", type: "lab", teacher: "Dr. Dan Demo",
            mode: "online", room: "", note: "Make-up lab" },
          { date: "2027-12-14", start: 10, end: 12, course: "vz", type: "project", teacher: "Dr. Fay Template",
            mode: "in-person", room: "C010", note: "Project pitch session" }
        ],

        // calendar: coloured periods + month grids for THIS semester, optional official image/PDF
        calendar: {
          // kind: teach | vac | exam | break
          periods: [
            { from: "2027-09-27", to: "2027-12-17", kind: "teach", label: "Teaching (weeks 1-12)" },
            { from: "2027-12-20", to: "2028-01-02", kind: "break", label: "Winter break" },
            { from: "2028-01-03", to: "2028-01-14", kind: "teach", label: "Teaching (weeks 13-14)" },
            { from: "2028-01-17", to: "2028-02-04", kind: "exam", label: "Exam session" },
            { from: "2028-02-07", to: "2028-02-18", kind: "vac", label: "Inter-semester break" }
          ],
          // months: [year, month0] (0 = January)
          months: [[2027, 8], [2027, 9], [2027, 10], [2027, 11], [2028, 0], [2028, 1]],
          note: "Teaching ends <b>14 Jan 2028</b>; exams run until 4 Feb."
          // image: "assets/calendar.png", pdf: "assets/calendar.pdf"  // optional official calendar
        },

        // tabs: left out = automatic (Overview, Schedule, Calendar, Courses, Info)

        // sections: this semester's sections (after the `common` ones), rendered top to bottom
        // "[ ] " prefix = tickable item (saved in localStorage). Give sections an id to keep ticks stable.
        sections: [
          // news kind -> News tab (dated feed, newest first; items older than 7 days lose the "new" badge)
          { kind: "news", title: "Announcements", items: [
            { date: "2027-09-24", title: "Welcome week: orientation on Friday", source: "official",
              text: "Orientation starts at 9:00 in room A101. Details: <a href='https://example.org/welcome'>example.org/welcome</a>" },
            { date: "2027-10-06", title: "Lab subgroups are published", source: "teacher", course: "ml",
              text: "Check your subgroup on the <a href='https://learn.example.org/aml'>course page</a> before the first lab." },
            { date: "2027-10-11", title: "Lab on 12 Oct is cancelled", source: "secretariat", course: "ml",
              text: "Confirmed by the class representative; see the schedule." },
            { date: "2027-10-29", title: "Quiz may move to week 9", source: "student", course: "db", unconfirmed: true,
              text: "Heard from another student, not confirmed by the teacher yet." },
            { date: "2027-11-02", title: "Essay topics for Ethics are open", source: "teacher", course: "et",
              text: "Pick a topic from the <a href='https://example.org/ethics-topics'>topic list</a>; draft due 26 Nov." },
            { date: "2027-11-03", title: "Student cards ready for pickup", source: "official" }
          ] },
          // explicit tab: "todo" (it would land there anyway: highlight + tickable items)
          { kind: "list", id: "now", title: "Do now", highlight: true, tab: "todo", items: [
            "[ ] Upload enrolment documents before 15 Oct",
            "[ ] Pick your lab subgroup (Schedule tab, Subgroups button)",
            "Install Python 3.12 and Jupyter for the first lab"
          ] },
          { kind: "schedule", title: "Weekly schedule" },
          { kind: "calendar", title: "Academic calendar" },
          { kind: "course", course: "ml", items: [
            "Slides and notebooks on the course platform",
            "Final grade: 70% exam, 30% lab reports",
            "[ ] Read chapter 1 before the first lecture"
          ] },
          { kind: "course", course: "db", items: [
            "Continuous assessment: 3 lab tasks and one quiz",
            "Lectures on even weeks only",
            "[ ] Set up the lab database account"
          ] },
          { kind: "course", course: "st", items: [
            "Written exam plus short oral",
            "Seminar is online on odd weeks"
          ] },
          { kind: "course", course: "vz", items: [
            "Team project (3-4 students), pitch on 14 Dec",
            "[ ] Form a team and register the topic"
          ] },
          { kind: "course", course: "et", items: [
            "One 1500-word essay, draft due 26 Nov",
            "Weeks 4-12 are held online"
          ] }
        ]
      },

      // ---------- Semester 2: smaller, with its own weeks, courses and calendar ----------
      { id: "y1s2", title: "Semester 2", subtitle: "Spring 2028 - teaching 21 Feb to 26 May",
        weeks: {
          segments: [
            { start: "2028-02-21", count: 8 }, // weeks 1-8
            { start: "2028-04-24", count: 6 }  // weeks 9-14 (after the spring break)
          ]
        },
        courses: [
          { id: "nl", title: "Natural Language Processing", short: "NLP", color: "teal", description: "Text processing, language models and evaluation of NLP systems.", ects: 6, evaluation: "E (exam)",
            hours: { course: 2, lab: 2 },
            teachers: [ { name: "Prof. Hana Sample", role: "course", email: "hana.sample@example.org" }, { name: "Dr. Ivo Demo", role: "lab", email: "ivo.demo@example.org" } ],
            grading: { components: [ { name: "Exam", weight: 60 }, { name: "Lab project", weight: 40 } ], passRule: "Exam of at least 5/10" },
            links: [ { label: "Course page", url: "https://learn.example.org/nlp" } ] },
          { id: "bd", title: "Big Data Systems", short: "BDS", color: "red", description: "Distributed storage and processing systems for large datasets.", ects: 5, evaluation: "V (continuous)",
            hours: { course: 2, lab: 1 },
            teachers: [ { name: "Prof. Jon Placeholder", role: "course + lab", email: "jon.placeholder@example.org" } ],
            contacts: [ { name: "Cluster admin", role: "Platform", email: "cluster@example.org" } ],
            grading: { components: [ { name: "Lab portfolio", weight: 70 }, { name: "Quiz", weight: 30 } ] } },
          { id: "op", title: "Optimisation Methods", short: "OPT", color: "amber", description: "Convex and non-convex optimisation as used in learning algorithms.", ects: 5, evaluation: "E (exam)",
            hours: { course: 2 },
            teachers: [ { name: "Prof. Kim Mock", role: "course", email: "kim.mock@example.org" } ],
            grading: { components: [ { name: "Written exam", weight: 100 } ] } },
          { id: "cp", title: "Capstone Seminar", short: "CAP", color: "blue", description: "Capstone seminar: a team project presented to an industry panel.", ects: 4, evaluation: "P (project)",
            hours: { seminar: 2 },
            teachers: [ { name: "Dr. Lee Template", role: "seminar", email: "lee.template@example.org" } ],
            grading: { notes: "Graded by the supervisor; weights not published (unconfirmed)." } }
        ],
        timetable: [
          { course: "nl", type: "course", day: 0, start: 14, end: 16, teacher: "Prof. Hana Sample", room: "A101",
            group: null, parity: null, rules: [ { weeks: [[1, 14]], mode: "in-person" } ] },
          { course: "nl", type: "lab", day: 2, start: 16, end: 18, teacher: "Dr. Ivo Demo", room: "B201",
            group: null, parity: null, rules: [ { weeks: [[1, 14]], mode: "in-person" } ] },
          { course: "bd", type: "course", day: 1, start: 10, end: 12, teacher: "Prof. Jon Placeholder", room: "A102",
            group: null, parity: null,
            rules: [ { weeks: [[1, 8]], mode: "in-person" }, { weeks: [[9, 14]], mode: "online" } ] },
          { course: "bd", type: "lab", day: 3, start: 10, end: 12, teacher: "Prof. Jon Placeholder", room: "B202",
            group: null, parity: "even", rules: [ { weeks: [[1, 14]], mode: "in-person" } ] },
          { course: "op", type: "course", day: 2, start: 10, end: 12, teacher: "Prof. Kim Mock", room: "A103",
            group: null, parity: null, rules: [ { weeks: [[1, 14]], mode: "in-person" } ] },
          { course: "cp", type: "seminar", day: 4, start: 13, end: 15, teacher: "Dr. Lee Template", room: "C010",
            group: null, parity: null, rules: [ { weeks: [[2, 13]], mode: "in-person" } ] }
        ],
        daysOff: {
          "2028-04-17": "Easter Monday (fictional)"
        },
        deviations: [
          { date: "2028-03-15", course: "nl", type: "lab", change: "online", note: "Moved online for this day", unconfirmed: false }
        ],
        extraSessions: [
          { date: "2028-05-10", start: 16, end: 18, course: "cp", type: "seminar", teacher: "Dr. Lee Template",
            mode: "in-person", room: "C010", note: "Mid-term project review" }
        ],
        calendar: {
          periods: [
            { from: "2028-02-21", to: "2028-04-14", kind: "teach", label: "Teaching (weeks 1-8)" },
            { from: "2028-04-17", to: "2028-04-21", kind: "break", label: "Spring break" },
            { from: "2028-04-24", to: "2028-05-26", kind: "teach", label: "Teaching (weeks 9-14)" },
            { from: "2028-05-29", to: "2028-06-16", kind: "exam", label: "Exam session" },
            { from: "2028-06-19", to: "2028-09-24", kind: "vac", label: "Summer vacation" }
          ],
          months: [[2028, 1], [2028, 2], [2028, 3], [2028, 4], [2028, 5]],
          note: "Dates are indicative and may change."
        },
        sections: [
          { kind: "news", title: "Announcements", items: [
            { date: "2028-03-06", title: "Capstone supervisors assigned", source: "official", course: "cp",
              text: "See the list at <a href='https://example.org/capstone'>example.org/capstone</a>." },
            { date: "2028-03-20", title: "Cluster maintenance on Saturday", source: "secretariat", course: "bd", unconfirmed: true }
          ] },
          // tickable list without highlight -> To-Do tab by default; makes the To-Do tab exist in this semester
          { kind: "list", id: "exams", title: "Before the exam session", tab: "todo", items: [
            "[ ] Check your exam seat and room on the portal",
            "[ ] Submit the Big Data lab portfolio (26 May)",
            "[ ] Revise past Optimisation papers"
          ] },
          { kind: "list", id: "now", title: "Do now", highlight: true, tab: "todo", items: [
            "[ ] Register your Capstone topic before 31 Mar",
            "Refresh linear algebra for Optimisation"
          ] },
          { kind: "schedule", title: "Weekly schedule" },
          { kind: "calendar", title: "Academic calendar" },
          { kind: "course", course: "nl", items: [
            "Final grade: 60% exam, 40% lab project",
            "[ ] Install the course toolkit before week 1"
          ] },
          { kind: "course", course: "bd", items: [
            "Continuous assessment: lab portfolio due 26 May",
            "Lab on even weeks only; lectures online from week 9"
          ] },
          { kind: "course", course: "cp", items: [
            "Individual project with a supervisor, mid-term review on 10 May"
          ] }
        ]
      }
    ] },

    // ================= Year 2 =================
    { id: "y2", title: "Year 2 · 2028–2029", semesters: [

      // Placeholder: no weeks/calendar yet, so it is never auto-selected and only shows these sections
      { id: "y2s1", title: "Semester 1", subtitle: "Not planned yet - timetable to be published",
        courses: [
          { id: "dl", title: "Deep Learning", short: "DL", color: "green", description: "Neural network architectures, training and regularisation.", ects: 6, evaluation: "E (exam)" },
          { id: "ci", title: "Causal Inference", short: "CI", color: "violet", description: "Causal graphs, interventions and estimating effects from observational data.", ects: 5, evaluation: "E (exam)" },
          { id: "rm", title: "Research Methods", short: "RM", color: "teal", description: "How to read, plan and write research: literature review and experiment design.", ects: 4, evaluation: "V (continuous)" },
          { id: "el", title: "Elective", short: "ELE", color: "grey", description: "A free elective chosen from the faculty catalogue.", ects: 5, evaluation: "V (continuous)" }
        ],
        sections: [
          { kind: "studyplan", title: "Study plan" }
        ]
      }
    ] }
  ]
};
