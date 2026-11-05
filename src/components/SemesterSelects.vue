<script setup>
import {computed} from "vue";
import {t} from "../lib/strings.js";
// Year / Semester selects. Semester titles may repeat across years, hence the Year select; changing either emits the semester id to open.
const props = defineProps({N: Object, SEMS: Array, auto: Object, sem: Object});
const emit = defineEmits(["pick"]);
const years = computed(() => props.N.years.filter(y => props.SEMS.some(s => s.yearId === y.id)));
const inYear = computed(() => props.SEMS.filter(s => s.yearId === props.sem.yearId));
const pickYear = e => { const ys = props.SEMS.filter(s => s.yearId === e.target.value); emit("pick", (ys.find(s => s === props.auto) || ys[0]).id); }; // that year's automatic or first semester
</script>

<template>
  <div id="sems" role="group" :aria-label="t('nav.yearSemester')">
    <template v-if="SEMS.length >= 2">
      <h2>{{ t('nav.semesterHeading') }}</h2>
      <template v-if="years.length > 1">
        <label for="ysel">{{ t('nav.year') }}</label>
        <select id="ysel" @change="pickYear"><option v-for="y in years" :key="y.id" :value="y.id" :selected="y.id === sem.yearId">{{ y.title }}</option></select>
      </template>
      <label for="ssel">{{ t('nav.semester') }}</label>
      <select id="ssel" @change="emit('pick', $event.target.value)"><option v-for="x in inYear" :key="x.id" :value="x.id" :selected="x === sem">{{ x === auto ? t('nav.semesterNow', {title: x.title}) : x.title }}</option></select>
    </template>
  </div>
</template>
