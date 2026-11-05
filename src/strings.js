// UI strings: one flat default (English) table, read only through t() / tx(). A data set can reword or translate any key with
// meta.strings = { "key": "text" } and set meta.locale ("ro-RO") for weekday/month names and date formats. Strings are PLAIN TEXT:
// t() returns text, tx() escapes the template and fills {placeholders} with HTML the calling code built. docs/STRINGS.md lists every key
// (node scripts/gen-strings-doc.mjs). Plain script (no modules) so it works from file://; also evaluated by node for the validator/tests.
var HUB_STRINGS = {
  // document + navigation
  "doc.title": "Semester hub",
  "nav.menuOpen": "Open menu",
  "nav.menuClose": "Close menu",
  "nav.label": "Navigation",
  "nav.searchPlaceholder": "Search…",
  "nav.searchLabel": "Search all tabs",
  "nav.sections": "Sections",
  "nav.yearSemester": "Year and semester",
  "nav.semesterHeading": "Semester",
  "nav.year": "Year",
  "nav.semester": "Semester",
  "nav.semesterNow": "{title} · now",
  "nav.searchResults": "Search results",
  // errors (shown before the data set is loaded, so always the defaults)
  "err.invalidSet": "Invalid data set name.",
  "err.setNotFound": "Data set \"{set}\" not found (expected data/{set}/data.js).",
  // footer
  "footer.madeBy": "Made by {name}",
  // default tab titles
  "tab.news": "News",
  "tab.todo": "To-Do",
  "tab.schedule": "Schedule",
  "tab.calendar": "Calendar",
  "tab.courses": "Courses",
  "tab.plan": "Study plan",
  "tab.contacts": "Contacts",
  "tab.info": "Info",
  // news tags
  "news.new": "new",
  "news.unconfirmed": "? unconfirmed",
  // course header lines
  "course.ects": "{n} ECTS",
  "course.evaluation": "evaluation {value}",
  "course.grading": "Grading: {value}",
  "course.contacts": "Contacts: {value}",
  // session types and labels
  "type.course": "course",
  "type.lab": "lab",
  "type.project": "project",
  "type.seminar": "seminar",
  "schedule.subgroup": "SG{n}",
  "schedule.noClasses": "No classes",
  "schedule.online": "Online",
  "schedule.inPerson": "In person",
  "schedule.onlineTag": " [online]",
  "schedule.notHeld": "NOT HELD",
  // weekly schedule
  "schedule.weekOdd": "Week {n} · odd week",
  "schedule.weekEven": "Week {n} · even week",
  "schedule.prev": "Previous week",
  "schedule.next": "Next week",
  "schedule.thisWeek": "this week",
  "schedule.backToCurrent": "Back to current week",
  "schedule.download": "Download .ics (all weeks)",
  "schedule.outside": "Today is outside the weeks shown (before the term or after it); showing the nearest week.",
  "schedule.legend.label": "Legend",
  "schedule.legend.differs": "Differs from the timetable",
  "schedule.legend.notHeld": "Not held",
  "schedule.legend.dayOff": "Day off or vacation",
  "schedule.legend.unconfirmed": "Unconfirmed report",
  "schedule.legend.extra": "Extra session",
  "schedule.groups.button": "Subgroups",
  "schedule.groups.title": "Your subgroup per subject",
  "schedule.groups.all": "All subgroups",
  "schedule.groups.option": "Subgroup {n}",
  "schedule.groups.exception": "{course}: {group}",
  "schedule.groups.presetAll": "Show all",
  "schedule.groups.presetN": "Subgroup {n} for all",
  "schedule.groups.reset": "Reset to defaults",
  "schedule.groups.close": "Close",
  "schedule.help.title": "How to add to Google / Outlook",
  "schedule.help.body": "Download the .ics (it contains the sessions of the subgroups you selected). Google Calendar: Settings → Import & export → Import. Outlook: Add calendar → Upload from file (or File → Open & Export → Import/Export). It is a snapshot: later changes aren't synced, so re-download and delete the old import if things change. Times are saved as local time.",
  // .ics file
  "ics.calendarName": "Timetable",
  "ics.fileName": "timetable",
  "ics.unconfirmed": " (unconfirmed)",
  // academic calendar
  "calendar.legend.teaching": "Teaching",
  "calendar.legend.exams": "Exams",
  "calendar.legend.dayOff": "Vacation / day off",
  "calendar.modes": "Calendar view",
  "calendar.mode.week": "Week",
  "calendar.mode.month": "Month",
  "calendar.mode.year": "Year",
  "calendar.today": "Today",
  "calendar.prev": "Previous",
  "calendar.next": "Next",
  "calendar.imageAlt": "Official academic calendar",
  "calendar.officialDoc": "Official document: {link}",
  // day details modal
  "modal.close": "Close",
  "modal.prevDay": "Previous day",
  "modal.nextDay": "Next day",
  "modal.empty": "Nothing scheduled on this day.",
  "modal.period": "{label} ({from} – {to})",
  "modal.dayOff": "Day off: {label}",
  "modal.sessions": "Timetable",
  "modal.news": "News",
  "modal.notHeld": "Not held",
  "modal.differs": "Differs from the timetable",
  "modal.extra": "Extra session",
  "modal.openSchedule": "Open in Schedule",
  // study plan + directory
  "plan.abbr.course": "C",
  "plan.abbr.seminar": "S",
  "plan.abbr.lab": "L",
  "plan.abbr.project": "P",
  "plan.ects": "{n} ECTS",
  "plan.ectsAtLeast": "≥{n} ECTS",
  "plan.unknown": "–",
  "plan.atLeast": "≥{n}",
  "plan.stat.ects": "Total credits",
  "plan.stat.subjects": "Subjects",
  "plan.stat.exams": "Exams",
  "plan.stat.cont": "Continuous",
  "plan.stat.other": "Other",
  "plan.stat.hours": "Hours per week",
  "plan.eval.exam": "Exam",
  "plan.eval.cont": "Continuous",
  "plan.eval.proj": "Project",
  "plan.hours.course": "Course",
  "plan.hours.seminar": "Seminar",
  "plan.hours.lab": "Lab",
  "plan.hours.project": "Project",
  "plan.hoursChip": "{kind}: {n} h/week",
  "plan.hoursTotalShort": "= {n} h",
  "plan.component": "Component",
  "plan.weight": "Weight",
  "plan.note": "Note",
  "plan.total": "Total",
  "plan.notHundred": " ⚠ not 100%",
  "plan.passRule": "Pass rule:",
  "plan.noGrading": "No grading details recorded yet.",
  "plan.col.subject": "Subject",
  "plan.col.ects": "ECTS",
  "plan.col.eval": "Eval.",
  "plan.col.hours": "Hours/week",
  "plan.col.grading": "Grading",
  "plan.col.teachers": "Teachers",
  "plan.noSubjects": "No subjects listed for this semester yet.",
  "plan.thisSemester": "This semester",
  "plan.programme": "Programme",
  "plan.bySubject": "By subject",
  "plan.noContacts": "No contacts listed."
};

var HUB_LOCALE = "en-GB"; // Intl locale for weekday/month names and date formats (meta.locale)
var HUB_OVERRIDES = {};

// meta.strings / meta.locale of the loaded data set; never throws, unknown keys and non-strings are ignored with a warning
function setStrings(meta) {
  var m = meta || {}, s = m.strings;
  HUB_OVERRIDES = {};
  HUB_LOCALE = "en-GB";
  if (m.locale !== undefined) {
    var ok = false;
    try { ok = typeof m.locale === "string" && Intl.DateTimeFormat.supportedLocalesOf([m.locale]).length > 0; } catch (e) { ok = false; }
    if (ok) HUB_LOCALE = m.locale; else console.warn("meta.locale " + JSON.stringify(m.locale) + " is not a supported locale; using en-GB");
  }
  if (s === undefined) return;
  if (!s || typeof s !== "object" || Array.isArray(s)) { console.warn("meta.strings must be an object of key -> text"); return; }
  Object.keys(s).forEach(function (k) {
    if (!(k in HUB_STRINGS)) console.warn("meta.strings: unknown key " + JSON.stringify(k));
    else if (typeof s[k] !== "string") console.warn("meta.strings." + k + " must be a string");
    else HUB_OVERRIDES[k] = s[k];
  });
}

function hubTemplate(key) {
  if (key in HUB_OVERRIDES) return HUB_OVERRIDES[key];
  if (key in HUB_STRINGS) return HUB_STRINGS[key];
  console.warn("missing string key " + key);
  return key;
}

// plain text: {name} placeholders are replaced by vars.name as-is (use for textContent / attributes)
function t(key, vars) {
  return hubTemplate(key).replace(/\{(\w+)\}/g, function (all, n) { return vars && n in vars ? String(vars[n]) : all; });
}

// HTML: the template is escaped (so a reworded string can't inject markup), then each {name} is replaced by vars.name, which the
// caller must already have escaped / built as HTML
function tx(key, vars) {
  return esc(hubTemplate(key)).replace(/\{(\w+)\}/g, function (all, n) { return vars && n in vars ? String(vars[n]) : all; });
}
