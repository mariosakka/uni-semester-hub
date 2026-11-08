<script setup>
import {computed} from "vue";
import {t, tx} from "../../lib/strings.js";
import {esc} from "../../lib/util.js";
import {courseOf} from "../../lib/schedule.js";
import {gradingSummary, people} from "../../lib/plan.js";
import {ITEMS} from "../../lib/render.js";
import CheckList from "./CheckList.vue";
import RichText from "../RichText.vue";

const props = defineProps({
  sec: {type: Object, required: true},
  semester: {type: Object, required: true}
});

const course = computed(() => courseOf(props.semester, props.sec.course));
// header lines (trusted HTML): teachers/ECTS/evaluation, grading
const lines = computed(() => {
  const c = course.value, bits = [], out = [], gs = gradingSummary(c);
  if ((c.teachers || []).length) bits.push(c.teachers.map(p => esc(p.name) + (p.role ? ` (${esc(p.role)})` : "")).join(", "));
  if (c.ects) bits.push(esc(t("course.ects", {n: c.ects})));
  if (c.evaluation) bits.push(tx("course.evaluation", {value: `<b>${esc(c.evaluation)}</b>`}));
  if (bits.length) out.push(bits.join(" · "));
  if (gs) out.push(tx("course.grading", {value: gs + ((c.grading || {}).passRule ? " · " + esc(c.grading.passRule) : "")}));
  return out;
});
const contacts = computed(() => people(course.value).filter(p => p.email || p.phone || p.note));
const groups = computed(() => props.sec.groups || []);
</script>

<template>
  <RichText v-for="(l, i) in lines" :key="i" tag="p" class="chead" :html="l" />
  <CheckList v-if="(sec.items || []).length" :sec="sec" :semester="semester" />
  <details v-for="(g, gi) in groups" :key="gi" class="cgroup" :open="g.open === true">
    <summary><RichText :html="g.title" /><span class="cg-n">{{ (g.items || []).length }}</span></summary>
    <CheckList :sec="{kind: 'list', items: g.items}" :semester="semester" />
  </details>
  <details v-if="contacts.length" class="cgroup">
    <summary>{{ t("course.contacts") }}<span class="cg-n">{{ contacts.length }}</span></summary>
    <ul class="ctl"><li v-for="(p, i) in contacts" :key="i"><RichText :html="ITEMS.contacts(p)" /></li></ul>
  </details>
</template>
