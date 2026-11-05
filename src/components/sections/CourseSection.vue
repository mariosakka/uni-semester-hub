<script setup>
import {computed} from "vue";
import {t, tx} from "../../lib/strings.js";
import {esc} from "../../lib/util.js";
import {courseOf} from "../../lib/schedule.js";
import {gradingSummary, peopleLine} from "../../lib/plan.js";
import CheckList from "./CheckList.vue";
import RichText from "../RichText.vue";

const props = defineProps({
  sec: {type: Object, required: true},
  id: {type: [String, Number], required: true},
  done: {type: Object, required: true},
  semester: {type: Object, required: true}
});
const emit = defineEmits(["toggle"]);

// header lines (trusted HTML): teachers/ECTS/evaluation, grading, contacts
const lines = computed(() => {
  const c = courseOf(props.semester, props.sec.course), bits = [], out = [];
  if ((c.teachers || []).length) bits.push(c.teachers.map(p => esc(p.name) + (p.role ? ` (${esc(p.role)})` : "")).join(", "));
  if (c.ects) bits.push(esc(t("course.ects", {n: c.ects})));
  if (c.evaluation) bits.push(tx("course.evaluation", {value: `<b>${esc(c.evaluation)}</b>`}));
  const ppl = [...(c.teachers || []).filter(p => p.email || p.phone || p.note), ...(c.contacts || [])], gs = gradingSummary(c);
  if (bits.length) out.push(bits.join(" · "));
  if (gs) out.push(tx("course.grading", {value: gs + ((c.grading || {}).passRule ? " · " + esc(c.grading.passRule) : "")}));
  if (ppl.length) out.push(tx("course.contacts", {value: peopleLine(ppl)}));
  return out;
});
</script>

<template>
  <RichText v-for="(l, i) in lines" :key="i" tag="p" class="chead" :html="l" />
  <CheckList :id="id" :sec="sec" :done="done" :semester="semester" @toggle="(k, v) => emit('toggle', k, v)" />
</template>
