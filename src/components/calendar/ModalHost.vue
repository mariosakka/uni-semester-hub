<script setup>
import {ref, computed, watch, nextTick, toRaw, onMounted, onBeforeUnmount} from "vue";
import {t} from "../../lib/strings.js";
import {iso, addDays, parseDate, fmtLong} from "../../lib/util.js";
import {sessionInfo} from "../../lib/schedule.js";
import {modal, closeModal} from "../../lib/shared.js";
import DayBody from "./DayBody.vue";
import SessionBody from "./SessionBody.vue";
import "../../styles/calendar.css";
// The single open modal (shared.js `modal`): a div role="dialog" (not <dialog>, for Safari 14) with backdrop, close button, Esc, focus moved in
// and returned, Tab kept inside, iOS-safe body scroll lock and previous/next day (day mode).
const card = ref(null), closeBtn = ref(null), prevBtn = ref(null), nextBtn = ref(null);
const sess = computed(() => modal.kind === "session");
const D = computed(() => toRaw(modal.D));
const info = computed(() => sess.value ? sessionInfo(D.value, toRaw(modal.sess)) : null);
const title = computed(() => sess.value ? info.value.course.title : modal.kind ? fmtLong(parseDate(modal.key)) : "");

// iOS Safari ignores overflow:hidden on <body> for scrolling, so the page is pinned with position:fixed and the scroll offset restored on close
let y = 0, locked = false;
function lock() { if (locked) return; y = window.pageYOffset; document.body.style.top = -y + "px"; document.body.classList.add("modal-open"); locked = true; }
function unlock() { if (!locked) return; document.body.classList.remove("modal-open"); document.body.style.top = ""; window.scrollTo(0, y); locked = false; }
function close(noFocus) { if (!modal.kind) return; unlock(); if (noFocus) modal.opener = null; closeModal(); }
watch(() => modal.kind, (k, was) => { if (k) { lock(); if (!was || k !== was) nextTick(() => closeBtn.value && closeBtn.value.focus()); } else unlock(); });
function go(dir) { modal.key = iso(addDays(parseDate(modal.key), dir)); nextTick(() => (dir < 0 ? prevBtn : nextBtn).value.focus()); }
function openWeek(sem) { close(true); location.hash = `#${sem}/schedule`; }

const onKey = e => { if (e.key === "Escape" && modal.kind) { e.stopPropagation(); close(); } };
const onHash = () => close(true); // navigating elsewhere (e.g. "Open in Schedule") closes it
function trap(e) {
  if (e.key !== "Tab") return;
  const f = [...card.value.querySelectorAll("button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])")].filter(x => x.offsetParent !== null || x === document.activeElement);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1], at = document.activeElement;
  if (e.shiftKey && (at === first || at === card.value)) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && at === last) { e.preventDefault(); first.focus(); }
}
onMounted(() => { document.addEventListener("keydown", onKey, true); addEventListener("hashchange", onHash); }); // capture: wins over other Esc handlers
onBeforeUnmount(() => { document.removeEventListener("keydown", onKey, true); removeEventListener("hashchange", onHash); unlock(); });
</script>

<template>
  <div v-if="modal.kind" class="dm" @keydown="trap">
    <div class="dm-back" @click="close()"></div>
    <div ref="card" :class="['dm-card', sess && 'csess c-' + (info.course.color || 'grey')]" role="dialog" aria-modal="true" aria-labelledby="dm-title" tabindex="-1">
      <div class="dm-head">
        <button ref="prevBtn" type="button" class="dm-prev" :hidden="sess" :aria-label="t('modal.prevDay')" @click="go(-1)">◀</button>
        <h3 id="dm-title">{{ title }}</h3>
        <button ref="nextBtn" type="button" class="dm-next" :hidden="sess" :aria-label="t('modal.nextDay')" @click="go(1)">▶</button>
        <button ref="closeBtn" type="button" class="dm-close" :aria-label="t('modal.close')" @click="close()">✕</button>
      </div>
      <div class="dm-body">
        <SessionBody v-if="sess" :info="info" :D="D" :opener="modal.opener"/>
        <DayBody v-else :D="D" :day-key="modal.key" @open-week="openWeek"/>
      </div>
    </div>
  </div>
</template>
