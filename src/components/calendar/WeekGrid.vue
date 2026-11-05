<script setup>
// Seven large day cells Monday..Sunday: day label, period / day-off label, deadline/exam markers, that day compact session lines
import {computed} from "vue";
import {iso, addDays, fmtDate, dayName, fmtTime} from "../../lib/util.js";
import {courseOf, place, weekSessions} from "../../lib/schedule.js";
import {weekNumberOf, dayState} from "../../lib/calendar.js";
import {useSubgroupSync} from "../../composables/useSubgroupSync.js";
import {t} from "../../lib/strings.js";
import DayCell from "./DayCell.vue";

const props = defineProps({semester: {type: Object, required: true}, start: {type: Date, required: true}, today: {type: String, required: true}});
const {tick} = useSubgroupSync();
const days = computed(() => {
  tick.value; // subgroup choice changes the sessions
  const w = weekNumberOf(props.semester, props.start), by = {};
  (w ? weekSessions(props.semester, w) : []).forEach(s => (by[s.key] ||= []).push(s));
  return [0, 1, 2, 3, 4, 5, 6].map(i => {
    const date = addDays(props.start, i), k = iso(date), st = dayState(props.semester, k);
    const lines = (by[k] || []).sort((a, b) => a.start - b.start).map(s => ({s, c: courseOf(props.semester, s.course), cx: s.status === "cancel"}));
    return {date, k, st, label: st.off || (st.p && st.p.label) || "", lines};
  });
});
</script>

<template>
  <div class="wgrid">
    <DayCell v-for="x in days" :key="x.k" :semester="semester" :st="x.st" :k="x.k" :today="today" extra=" wday">
      <span class="wn"><b>{{ dayName(x.date, "short") }}</b> {{ fmtDate(x.date) }}</span>
      <span v-if="x.label" class="wl">{{ x.label }}</span>
      <span v-if="x.st.ev.length" class="wk"><span v-for="(e, i) in x.st.ev" :key="i" :class="['km', e.kind]" :title="e.label">●</span></span>
      <span v-for="(l, i) in x.lines" :key="i" :class="['sl', 'c-' + (l.c.color || 'grey'), {cx: l.cx, dev: l.s.status === 'dev'}]">{{ fmtTime(l.s.start) }} {{ l.c.short || l.c.title }} · {{ l.cx ? t("modal.notHeld") : place(l.s) }}</span>
    </DayCell>
  </div>
</template>
