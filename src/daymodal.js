// Day-details modal for the Calendar. A div with role="dialog" (not <dialog>, for Safari 14): backdrop, close button, Esc, focus moved in and
// returned, Tab kept inside, iOS-safe body scroll lock, previous/next day. One instance for the page, content built from dayInfo() (calendar.js).
let DM = null;

function dmBuild() {
  const root = document.createElement("div");
  root.className = "dm"; root.hidden = true;
  root.innerHTML = `<div class="dm-back"></div><div class="dm-card" role="dialog" aria-modal="true" aria-labelledby="dm-title" tabindex="-1">` +
    `<div class="dm-head"><button type="button" class="dm-prev"></button><h3 id="dm-title"></h3><button type="button" class="dm-next"></button><button type="button" class="dm-close"></button></div>` +
    `<div class="dm-body"></div></div>`;
  document.body.append(root);
  const m = DM = {root, card: root.querySelector(".dm-card"), body: root.querySelector(".dm-body"), title: root.querySelector("#dm-title"), D: null, key: "", opener: null, box: null, openKey: "", y: 0, locked: false};
  root.querySelector(".dm-back").onclick = () => dmClose();
  root.querySelector(".dm-close").onclick = () => dmClose();
  root.querySelector(".dm-prev").onclick = () => dmGo(-1);
  root.querySelector(".dm-next").onclick = () => dmGo(1);
  m.body.onclick = e => { const b = e.target.closest("[data-open-week]"); if (b) { const V = m.D.viewFor ? m.D.viewFor(m.key) : m.D; dmClose(true); if (V.openWeek) V.openWeek(+b.dataset.openWeek); } };
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !root.hidden) { e.stopPropagation(); dmClose(); } }, true); // capture: wins over other Esc handlers
  addEventListener("hashchange", () => dmClose(true)); // navigating elsewhere (e.g. "Open in Schedule") closes it
  root.addEventListener("keydown", e => {
    if (e.key !== "Tab") return;
    const f = [...m.card.querySelectorAll("button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])")].filter(x => x.offsetParent !== null || x === document.activeElement);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1], at = document.activeElement;
    if (e.shiftKey && (at === first || at === m.card)) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && at === last) { e.preventDefault(); first.focus(); }
  });
  return m;
}

// iOS Safari ignores overflow:hidden on <body> for scrolling, so the page is pinned with position:fixed and the scroll offset restored on close
function dmLock(m) { if (m.locked) return; m.y = window.pageYOffset; document.body.style.top = -m.y + "px"; document.body.classList.add("modal-open"); m.locked = true; }
function dmUnlock(m) { if (!m.locked) return; document.body.classList.remove("modal-open"); document.body.style.top = ""; window.scrollTo(0, m.y); m.locked = false; }

function dayHTML(V, info) {
  const out = [], tag = (cls, text) => `<span class="tag ${cls}">${esc(text)}</span>`, rng = d => fmtDate(parseDate(d));
  if (info.week) out.push(`<p class="dm-week">${esc(t(info.parity === "odd" ? "schedule.weekOdd" : "schedule.weekEven", {n: info.week}))}</p>`);
  if (info.period) out.push(`<p>${esc(t("modal.period", {label: info.period.label, from: rng(info.period.from), to: rng(info.period.to)}))}</p>`);
  if (info.off) out.push(`<p class="dm-off">${esc(t("modal.dayOff", {label: info.off}))}</p>`);
  if (info.keys.length) out.push(`<h4>${esc(t("modal.keyDates"))}</h4><ul>${info.keys.map(e => `<li>${tag(e.kind === "exam" ? "unc" : "off", t(e.kind === "exam" ? "calendar.legend.keyExam" : "calendar.legend.task"))} ${esc(e.label)}</li>`).join("")}</ul>`);
  if (info.sessions.length) out.push(`<h4>${esc(t("modal.sessions"))}</h4>` + info.sessions.map(s => {
    const c = courseOf(V, s.course), cx = s.status === "cancel";
    const flag = cx ? "✕ " + t("modal.notHeld") : s.extra ? t("modal.extra") : s.status === "dev" ? "⚠ " + t("modal.differs") : "";
    return `<div class="acard c-${esc(c.color || "grey")}${cx ? " cx" : ""}${s.status === "dev" ? " dev" : ""}"><b>${fmtTime(s.start)}–${fmtTime(s.end)}</b> <span class="t">${esc(c.title)}</span>` +
      `<small>${esc(typeName(s.type))}${s.teacher ? " · " + esc(s.teacher) : ""}<br>${cx ? "" : esc(place(s))}</small>` +
      (flag || s.note ? `<span class="badge">${esc(flag)}${s.note ? " " + esc(s.note) : ""}${s.u ? " " + esc(t("news.unconfirmed")) : ""}</span>` : "") + `</div>`;
  }).join(""));
  if (info.news.length) out.push(`<h4>${esc(t("modal.news"))}</h4><ul>${info.news.map(n => `<li><b>${esc(n.title)}</b>${n.source ? ` ${tag("", n.source)}` : ""}${n.unconfirmed ? ` ${tag("unc", t("news.unconfirmed"))}` : ""}</li>`).join("")}</ul>`);
  if (!info.sessions.length && !info.keys.length && !info.news.length && !info.off) out.push(`<p class="note">${esc(t("modal.empty"))}</p>`);
  if (info.week && V.openWeek) out.push(`<p><button type="button" class="dm-open" data-open-week="${info.week}">${esc(t("modal.openSchedule"))}</button></p>`);
  return out.join("");
}

function dmRender(m, focusSel) {
  const V = m.D.viewFor ? m.D.viewFor(m.key) : m.D;
  m.title.textContent = fmtLong(parseDate(m.key));
  m.body.innerHTML = dayHTML(V, dayInfo(V, m.key));
  m.root.querySelector(".dm-prev").setAttribute("aria-label", t("modal.prevDay"));
  m.root.querySelector(".dm-next").setAttribute("aria-label", t("modal.nextDay"));
  m.root.querySelector(".dm-close").setAttribute("aria-label", t("modal.close"));
  m.root.querySelector(".dm-prev").textContent = "◀"; m.root.querySelector(".dm-next").textContent = "▶"; m.root.querySelector(".dm-close").textContent = "✕";
  m.body.scrollTop = 0;
  if (focusSel) { const f = m.root.querySelector(focusSel); if (f) f.focus(); }
}

function dmGo(dir) { const m = DM; m.key = iso(addDays(parseDate(m.key), dir)); dmRender(m, dir < 0 ? ".dm-prev" : ".dm-next"); }

function dmClose(noFocus) {
  const m = DM;
  if (!m || m.root.hidden) return;
  m.root.hidden = true; dmUnlock(m);
  if (noFocus) return;
  const back = m.opener && m.opener.isConnected ? m.opener : m.box && m.box.querySelector(`[data-k="${m.openKey}"]`); // the day cell that opened it (re-found if the view re-rendered)
  if (back) back.focus();
}

function openDayModal(D, key, opener, box) {
  const m = DM || dmBuild();
  Object.assign(m, {D, key, opener, box, openKey: key});
  dmRender(m);
  m.root.hidden = false; dmLock(m);
  m.root.querySelector(".dm-close").focus();
}
