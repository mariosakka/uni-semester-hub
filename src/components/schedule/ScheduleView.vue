<script setup>
import {computed, watch} from "vue";
import {t} from "../../lib/strings.js";
import {iso, addDays, fmtDate, dayName} from "../../lib/util.js";
import {currentIndex, isNow, weekSessions, hourRange, layoutLanes, downloadIcs} from "../../lib/schedule.js";
import {useModal} from "../../composables/useModal.js";
import {useScheduleTarget} from "../../composables/useScheduleTarget.js";
import {useSubgroupSync} from "../../composables/useSubgroupSync.js";
import {useWeekSelection} from "../../composables/useWeekSelection.js";
import WeekPicker from "./WeekPicker.vue";
import GroupChooser from "./GroupChooser.vue";
import ScheduleLegend from "./ScheduleLegend.vue";
import ScheduleGrid from "./ScheduleGrid.vue";
import ScheduleAgenda from "./ScheduleAgenda.vue";
import "../../styles/schedule.css";

// Weekly timetable: order is week row, subgroups row, legend, grid (wide) / agenda (phones), note, help.
const props = defineProps({semester: {type: Object, required: true}});
const {openSessionModal} = useModal();
const {target, clear} = useScheduleTarget();
const {tick} = useSubgroupSync();
const {T, i, go} = useWeekSelection(() => props.semester);

const real = computed(() => currentIndex(T.value));
const live = computed(() => isNow(T.value[real.value]));
const e = computed(() => T.value[i.value]);
const sess = computed(() => { tick.value; return e.value.w ? weekSessions(props.semester, e.value.w) : []; }); // a subgroup change re-lists the sessions
const lanes = computed(() => layoutLanes(sess.value));
const hours = computed(() => { tick.value; return hourRange(props.semester); });
const days = computed(() => {
  const offs = props.semester.daysOff || {};
  return [0, 1, 2, 3, 4].map(k => {
    const d = addDays(e.value.m, k); // vacation week: every day shows the label
    return {k, name: dayName(d, "short"), date: fmtDate(d), off: e.value.w ? offs[iso(d)] : e.value.label};
  });
});

// "Open in Schedule": jump to that week, then reset the request
watch([() => props.semester, () => target.sem + "/" + target.w], () => {
  if (target.sem !== props.semester.id || target.w == null) return;
  const k = T.value.findIndex(x => x.w === target.w);
  if (k >= 0) go(k);
  clear();
}, {immediate: true});
</script>

<template>
  <div>
    <WeekPicker :weeks="T" :index="i" :current="real" :live="live" @go="go" @ics="downloadIcs(semester)" />
    <GroupChooser :semester="semester" />
    <ScheduleLegend :semester="semester" />
    <ScheduleGrid :semester="semester" :days="days" :sess="sess" :lanes="lanes" :h0="hours[0]" :h1="hours[1]" @open="(s, el) => openSessionModal(semester, s, el)" />
    <ScheduleAgenda :semester="semester" :days="days" :sess="sess" @open="(s, el) => openSessionModal(semester, s, el)" />
    <p v-if="!live" class="note">{{ t('schedule.outside') }}</p>
    <details><summary>{{ t('schedule.help.title') }}</summary><p class="note">{{ t('schedule.help.body') }}</p></details>
  </div>
</template>
