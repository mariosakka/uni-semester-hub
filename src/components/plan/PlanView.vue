<script>
import {t} from "../../lib/strings.js";
import {planStats, ectsLabel} from "../../lib/plan.js";
import PlanRow from "./PlanRow.vue";
import "../../styles/plan.css";

const COLS = ["plan.col.subject", "plan.col.ects", "plan.col.eval", "plan.col.hours", "plan.col.grading", "plan.col.teachers"];

export default {
  components: {PlanRow},
  props: {D: Object},
  computed: {
    cs() { return this.D.courses || []; },
    heading() {
      const P = this.D.programme;
      return ((P.years.find(y => y.id === this.D.yearId) || {}).title || "") + (P.years.length > 1 ? " · " : "") + (this.D.title || t("plan.thisSemester"));
    },
    maxE() { return Math.max(10, ...this.cs.map(c => +c.ects || 0)); },
    tiles() {
      const st = planStats(this.cs), hours = !st.hoursKnown ? t("plan.unknown") : st.hoursKnown < st.subjects ? t("plan.atLeast", {n: st.hours}) : String(st.hours);
      return [[ectsLabel(this.cs), "plan.stat.ects"], [st.subjects, "plan.stat.subjects"], [st.exams, "plan.stat.exams"], [st.continuous, "plan.stat.cont"],
        ...(st.other ? [[st.other, "plan.stat.other"]] : []), [hours, "plan.stat.hours"]];
    }
  },
  methods: {t},
  COLS
};
</script>

<template>
  <h3>{{ heading }}</h3>
  <p v-if="!cs.length" class="note">{{ t('plan.noSubjects') }}</p>
  <template v-else>
    <ul class="pstats"><li v-for="[v, k] in tiles" :key="k"><b>{{ v }}</b><span>{{ t(k) }}</span></li></ul>
    <table class="ptbl">
      <thead><tr><th v-for="k in $options.COLS" :key="k" scope="col">{{ t(k) }}</th></tr></thead>
      <PlanRow v-for="(c, i) in cs" :key="i" :c="c" :i="i" :max-ects="maxE"/>
    </table>
  </template>
</template>
