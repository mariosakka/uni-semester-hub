<script setup>
import {calMonths} from "../../lib/calendar.js";
import MonthGrid from "./MonthGrid.vue";
// The whole academic year: every semester of the year with its months (semester boundaries = the headings and the period colours)
const props = defineProps({D: Object, today: String});
const D = props.D, Y = D.year || {semesters: [{title: "", months: calMonths(D)}], periods: (D.calendar || {}).periods || [], daysOff: D.daysOff, keyDates: D.keyDates};
const src = {calendar: {periods: Y.periods}, daysOff: Y.daysOff, keyDates: Y.keyDates};
</script>

<template>
  <template v-for="(s, i) in Y.semesters" :key="i">
    <h3 class="ysem">{{ s.title }}</h3>
    <div class="months"><MonthGrid v-for="[y, m] in s.months" :key="y + '-' + m" :D="D" :src="src" :y="y" :m="m" :today="today"/></div>
  </template>
</template>
