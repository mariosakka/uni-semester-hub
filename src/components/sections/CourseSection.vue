<script setup>
import {t, tx} from "../../lib/strings.js";
import {esc} from "../../lib/util.js";
import {courseOf} from "../../lib/schedule.js";
import {gradingSummary, peopleLine} from "../../lib/plan.js";
import CheckList from "./CheckList.vue";

const props = defineProps({sec: Object, id: [String, Number], done: Object, save: Function, D: Object});

// header lines (trusted HTML): teachers/ECTS/evaluation, grading, contacts
function head() {
  const c = courseOf(props.D, props.sec.course), bits = [], lines = [];
  if ((c.teachers || []).length) bits.push(c.teachers.map(p => esc(p.name) + (p.role ? ` (${esc(p.role)})` : "")).join(", "));
  if (c.ects) bits.push(esc(t("course.ects", {n: c.ects})));
  if (c.evaluation) bits.push(tx("course.evaluation", {value: `<b>${esc(c.evaluation)}</b>`}));
  const ppl = [...(c.teachers || []).filter(p => p.email || p.phone || p.note), ...(c.contacts || [])], gs = gradingSummary(c);
  if (bits.length) lines.push(bits.join(" · "));
  if (gs) lines.push(tx("course.grading", {value: gs + ((c.grading || {}).passRule ? " · " + esc(c.grading.passRule) : "")}));
  if (ppl.length) lines.push(tx("course.contacts", {value: peopleLine(ppl)}));
  return lines;
}
const lines = head();
</script>

<template>
  <p v-for="(l, i) in lines" :key="i" class="chead" v-html="l"></p>
  <CheckList :sec="sec" :id="id" :done="done" :save="save" :D="D" />
</template>
