<script setup>
import {ref, computed, watch, nextTick, toRaw} from "vue";
import {t} from "../../lib/strings.js";
import {iso, addDays, parseDate, fmtLong} from "../../lib/util.js";
import {sessionInfo} from "../../lib/schedule.js";
import {useModal} from "../../composables/useModal.js";
import {useBodyScrollLock} from "../../composables/useBodyScrollLock.js";
import {useFocusTrap} from "../../composables/useFocusTrap.js";
import {useEventListener} from "../../composables/useEventListener.js";
import DayBody from "./DayBody.vue";
import SessionBody from "./SessionBody.vue";
import "../../styles/calendar.css";
// The single open modal (useModal): a div role="dialog" (not <dialog>, for Safari 14) with backdrop, close button, Esc, focus moved in
// and returned, Tab kept inside, iOS-safe body scroll lock and previous/next day (day mode).
const {modal, closeModal} = useModal();
const card = ref(null), closeBtn = ref(null), prevBtn = ref(null), nextBtn = ref(null);
const sess = computed(() => modal.kind === "session");
const D = computed(() => toRaw(modal.D));
const info = computed(() => sess.value ? sessionInfo(D.value, toRaw(modal.sess)) : null);
const title = computed(() => sess.value ? info.value.course.title : modal.kind ? fmtLong(parseDate(modal.key)) : "");

const {unlock} = useBodyScrollLock(computed(() => !!modal.kind));
const trap = useFocusTrap(card);
function close(noFocus) { if (!modal.kind) return; unlock(); if (noFocus) modal.opener = null; closeModal(); }
watch(() => modal.kind, (k, was) => { if (k && (!was || k !== was)) nextTick(() => closeBtn.value && closeBtn.value.focus()); });
function go(dir) { modal.key = iso(addDays(parseDate(modal.key), dir)); nextTick(() => (dir < 0 ? prevBtn : nextBtn).value.focus()); }
function openWeek(sem) { close(true); location.hash = `#${sem}/schedule`; }

useEventListener(document, "keydown", e => { if (e.key === "Escape" && modal.kind) { e.stopPropagation(); close(); } }, true); // capture: wins over other Esc handlers
useEventListener(window, "hashchange", () => close(true)); // navigating elsewhere (e.g. "Open in Schedule") closes it
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
        <SessionBody v-if="sess" :info="info" :semester="D" :opener="modal.opener" />
        <DayBody v-else :semester="D" :day-key="modal.key" @open-week="openWeek" />
      </div>
    </div>
  </div>
</template>
