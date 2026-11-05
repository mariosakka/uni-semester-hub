<script setup>
import {monthName, dayName} from "../../lib/util.js";
import {kd, dayState} from "../../lib/calendar.js";
import DayCell from "./DayCell.vue";
// One month: heading, weekday initials (2024-01-01 is a Monday), blank lead cells, day buttons. `src` = a semester view or the year source.
const props = defineProps({D: Object, src: Object, y: Number, m: Number, today: String});
const lead = (new Date(props.y, props.m, 1).getDay() + 6) % 7, days = new Date(props.y, props.m + 1, 0).getDate();
</script>

<template>
  <div class="mon"><h3>{{ monthName(y, m) }} {{ y }}</h3><div class="mg">
    <i v-for="k in 7" :key="'w' + k" class="wd">{{ dayName(new Date(2024, 0, k), "narrow") }}</i>
    <i v-for="k in lead" :key="'l' + k"></i>
    <DayCell v-for="d in days" :key="d" :D="D" :st="dayState(src, kd(y, m, d))" :k="kd(y, m, d)" :today="today">{{ d }}</DayCell>
  </div></div>
</template>
