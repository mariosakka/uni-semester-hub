<script setup>
// Seven large day cells Monday..Sunday: day label, period / day-off label, deadline/exam markers, that day compact session lines
import {computed} from "vue";
import {iso, addDays, fmtDate, dayName, fmtTime} from "../../lib/util.js";
import {courseOf, place, weekSessions} from "../../lib/schedule.js";
import {weekNumberOf, dayState} from "../../lib/calendar.js";
import {groupTick} from "../../lib/shared.js";
import {t} from "../../lib/strings.js";
import DayCell from "./DayCell.vue";

const props = defineProps({D: Object, start: Date, today: String});
const days = computed(() => {
  groupTick.value; // subgroup choice changes the sessions
  const w = weekNumberOf(props.D, props.start), by = {};
  (w ? weekSessions(props.D, w) : []).forEach(s => (by[s.key] ||= []).push(s));
  return [0, 1, 2, 3, 4, 5, 6].map(i => {
    const date = addDays(props.start, i), k = iso(date), st = dayState(props.D, k);
    const lines = (by[k] || []).sort((a, b) => a.start - b.start).map(s => ({s, c: courseOf(props.D, s.course), cx: s.status === "cancel"}));
    return {date, k, st, label: st.off || (st.p && st.p.label) || "", lines};
  });
});
</script>

<template>
  <div class="wgrid">
    <DayCell v-for="x in days" :key="x.k" :D="D" :st="x.st" :k="x.k" :today="today" extra=" wday">
      <span class="wn"><b>{{ dayName(x.date, "short") }}</b> {{ fmtDate(x.date) }}</span>
      <span v-if="x.label" class="wl">{{ x.label }}</span>
      <span v-if="x.st.ev.length" class="wk"><span v-for="(e, i) in x.st.ev" :key="i" :class="['km', e.kind]" :title="e.label">●</span></span>
      <span v-for="(l, i) in x.lines" :key="i" :class="['sl', 'c-' + (l.c.color || 'grey'), {cx: l.cx, dev: l.s.status === 'dev'}]">{{ fmtTime(l.s.start) }} {{ l.c.short || l.c.title }} · {{ l.cx ? t("modal.notHeld") : place(l.s) }}</span>
    </DayCell>
  </div>
</template>
