<script setup>
import {computed} from "vue";
import {calMonths} from "../../lib/calendar.js";
import MonthGrid from "./MonthGrid.vue";
// The whole academic year: every semester of the year with its months (semester boundaries = the headings and the period colours)
const props = defineProps({semester: {type: Object, required: true}, today: {type: String, required: true}});
const Y = computed(() => props.semester.year || {semesters: [{title: "", months: calMonths(props.semester)}], periods: (props.semester.calendar || {}).periods || [], daysOff: props.semester.daysOff, keyDates: props.semester.keyDates});
const src = computed(() => ({calendar: {periods: Y.value.periods}, daysOff: Y.value.daysOff, keyDates: Y.value.keyDates}));
</script>

<template>
  <template v-for="(s, i) in Y.semesters" :key="i">
    <h3 class="ysem">{{ s.title }}</h3>
    <div class="months"><MonthGrid v-for="[y, m] in s.months" :key="y + '-' + m" :semester="semester" :src="src" :y="y" :m="m" :today="today" /></div>
  </template>
</template>
