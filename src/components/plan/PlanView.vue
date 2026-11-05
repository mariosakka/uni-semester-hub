<script setup>
import {computed} from "vue";
import {t} from "../../lib/strings.js";
import {planStats, ectsLabel} from "../../lib/plan.js";
import PlanRow from "./PlanRow.vue";
import "../../styles/plan.css";

const props = defineProps({semester: {type: Object, required: true}});

const COLS = ["plan.col.subject", "plan.col.ects", "plan.col.eval", "plan.col.hours", "plan.col.grading", "plan.col.teachers"];

const cs = computed(() => props.semester.courses || []);
const heading = computed(() => {
  const P = props.semester.programme;
  return ((P.years.find(y => y.id === props.semester.yearId) || {}).title || "") + (P.years.length > 1 ? " · " : "") + (props.semester.title || t("plan.thisSemester"));
});
const maxE = computed(() => Math.max(10, ...cs.value.map(c => +c.ects || 0)));
const tiles = computed(() => {
  const st = planStats(cs.value), hours = !st.hoursKnown ? t("plan.unknown") : st.hoursKnown < st.subjects ? t("plan.atLeast", {n: st.hours}) : String(st.hours);
  return [[ectsLabel(cs.value), "plan.stat.ects"], [st.subjects, "plan.stat.subjects"], [st.exams, "plan.stat.exams"], [st.continuous, "plan.stat.cont"],
    ...(st.other ? [[st.other, "plan.stat.other"]] : []), [hours, "plan.stat.hours"]];
});
</script>

<template>
  <h3>{{ heading }}</h3>
  <p v-if="!cs.length" class="note">{{ t('plan.noSubjects') }}</p>
  <template v-else>
    <ul class="pstats"><li v-for="[v, k] in tiles" :key="k"><b>{{ v }}</b><span>{{ t(k) }}</span></li></ul>
    <table class="ptbl">
      <thead><tr><th v-for="k in COLS" :key="k" scope="col">{{ t(k) }}</th></tr></thead>
      <PlanRow v-for="(c, i) in cs" :key="c.id || i" :c="c" :i="i" :max-ects="maxE" />
    </table>
  </template>
</template>
