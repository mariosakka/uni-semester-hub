<script setup>
import {computed} from "vue";
import {t} from "../../lib/strings.js";
import {parseDate, fmtDate, fmtTime} from "../../lib/util.js";
import {courseOf, typeName, place} from "../../lib/schedule.js";
import {dayInfo} from "../../lib/calendar.js";
import {groupTick, scheduleTarget} from "../../lib/shared.js";
// Day modal content: period, day off, deadlines/exams, sessions (with deviations), news dated that day, "Open in Schedule".
const props = defineProps({D: Object, dayKey: String});
const emit = defineEmits(["open-week"]);
const V = computed(() => props.D.viewFor ? props.D.viewFor(props.dayKey) : props.D);
const info = computed(() => { groupTick.value; return dayInfo(V.value, props.dayKey); });
const rng = d => fmtDate(parseDate(d));
const tagOf = e => e.kind === "exam" ? ["unc", "calendar.legend.keyExam"] : ["off", "calendar.legend.task"];
const sess = computed(() => info.value.sessions.map(s => {
  const c = courseOf(V.value, s.course), cx = s.status === "cancel";
  return {s, c, cx, flag: cx ? "✕ " + t("modal.notHeld") : s.extra ? t("modal.extra") : s.status === "dev" ? "⚠ " + t("modal.differs") : ""};
}));
function openWeek() { // sets the target, then the hash change closes the modal (ModalHost) and the Schedule tab shows that week
  scheduleTarget.sem = V.value.id; scheduleTarget.w = info.value.week;
  emit("open-week", V.value.id);
}
</script>

<template>
  <p v-if="info.week" class="dm-week">{{ t(info.parity === "odd" ? "schedule.weekOdd" : "schedule.weekEven", {n: info.week}) }}</p>
  <p v-if="info.period">{{ t("modal.period", {label: info.period.label, from: rng(info.period.from), to: rng(info.period.to)}) }}</p>
  <p v-if="info.off" class="dm-off">{{ t("modal.dayOff", {label: info.off}) }}</p>
  <template v-if="info.keys.length"><h4>{{ t("modal.deadlines") }}</h4>
    <ul><li v-for="(e, i) in info.keys" :key="i"><span :class="['tag', tagOf(e)[0]]">{{ t(tagOf(e)[1]) }}</span> {{ e.label }}</li></ul></template>
  <template v-if="sess.length"><h4>{{ t("modal.sessions") }}</h4>
    <div v-for="(x, i) in sess" :key="i" :class="['acard', 'c-' + (x.c.color || 'grey'), {cx: x.cx, dev: x.s.status === 'dev'}]"><b>{{ fmtTime(x.s.start) }}–{{ fmtTime(x.s.end) }}</b> <span class="t">{{ x.c.title }}</span><small>{{ typeName(x.s.type) }}{{ x.s.teacher ? " · " + x.s.teacher : "" }}<br>{{ x.cx ? "" : place(x.s) }}</small><span v-if="x.flag || x.s.note" class="badge">{{ x.flag }}{{ x.s.note ? " " + x.s.note : "" }}{{ x.s.u ? " " + t("news.unconfirmed") : "" }}</span></div></template>
  <template v-if="info.news.length"><h4>{{ t("modal.news") }}</h4>
    <ul><li v-for="(n, i) in info.news" :key="i"><b>{{ n.title }}</b><template v-if="n.source"> <span class="tag ">{{ n.source }}</span></template><template v-if="n.unconfirmed"> <span class="tag unc">{{ t("news.unconfirmed") }}</span></template></li></ul></template>
  <p v-if="!info.sessions.length && !info.keys.length && !info.news.length && !info.off" class="note">{{ t("modal.empty") }}</p>
  <p v-if="info.week"><button type="button" class="dm-open" @click="openWeek">{{ t("modal.openSchedule") }}</button></p>
</template>
