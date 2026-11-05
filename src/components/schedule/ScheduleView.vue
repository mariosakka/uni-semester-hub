<script>
import {t} from "../../lib/strings.js";
import {iso, addDays, fmtDate, dayName} from "../../lib/util.js";
import {groupTick, scheduleTarget, openSessionModal} from "../../lib/shared.js";
import {timeline, currentIndex, isNow, weekSessions, hourRange, layoutLanes, downloadIcs} from "../../lib/schedule.js";
import WeekPicker from "./WeekPicker.vue";
import GroupChooser from "./GroupChooser.vue";
import ScheduleLegend from "./ScheduleLegend.vue";
import ScheduleGrid from "./ScheduleGrid.vue";
import ScheduleAgenda from "./ScheduleAgenda.vue";

// Weekly timetable: order is week row, subgroups row, legend, grid (wide) / agenda (phones), note, help.
export default {
  components: {WeekPicker, GroupChooser, ScheduleLegend, ScheduleGrid, ScheduleAgenda},
  props: {D: Object},
  data() { return {i: this.start()}; },
  methods: {
    t, downloadIcs,
    start() { // the shown week is kept on D, so it survives tab and semester switches
      const T = timeline(this.D), i = this.D._wi === undefined ? currentIndex(T) : this.D._wi;
      return Math.min(Math.max(i, 0), T.length - 1);
    },
    go(i) { this.i = this.D._wi = i; },
    consumeTarget() { // "Open in Schedule": jump to that week, then reset the request
      const g = scheduleTarget;
      if (g.sem !== this.D.id || g.w == null) return;
      const i = this.T.findIndex(e => e.w === g.w);
      if (i >= 0) this.go(i);
      g.w = null;
    },
    open(s, el) { openSessionModal(this.D, s, el); }
  },
  computed: {
    T() { return timeline(this.D); },
    real() { return currentIndex(this.T); },
    live() { return isNow(this.T[this.real]); },
    e() { return this.T[this.i]; },
    sess() { groupTick.value; return this.e.w ? weekSessions(this.D, this.e.w) : []; }, // a subgroup change re-lists the sessions
    lanes() { return layoutLanes(this.sess); },
    hours() { groupTick.value; return hourRange(this.D); },
    days() {
      const {e} = this, offs = this.D.daysOff || {};
      return [0, 1, 2, 3, 4].map(k => {
        const d = addDays(e.m, k); // vacation week: every day shows the label
        return {k, name: dayName(d, "short"), date: fmtDate(d), off: e.w ? offs[iso(d)] : e.label};
      });
    }
  },
  created() {
    this.consumeTarget();
    this.$watch(() => scheduleTarget.sem + "/" + scheduleTarget.w, () => this.consumeTarget());
  },
  watch: { D() { this.i = this.start(); this.consumeTarget(); } }
};
</script>

<template>
  <div>
    <WeekPicker :T="T" :i="i" :real="real" :live="live" @go="go" @ics="downloadIcs(D)" />
    <GroupChooser :D="D" />
    <ScheduleLegend :D="D" />
    <ScheduleGrid :D="D" :days="days" :sess="sess" :lanes="lanes" :H0="hours[0]" :H1="hours[1]" @open="open" />
    <ScheduleAgenda :D="D" :days="days" :sess="sess" @open="open" />
    <p v-if="!live" class="note">{{ t('schedule.outside') }}</p>
    <details><summary>{{ t('schedule.help.title') }}</summary><p class="note">{{ t('schedule.help.body') }}</p></details>
  </div>
</template>

<style src="../../styles/schedule.css"></style>
