<script setup>
import {computed, inject, reactive} from "vue";
import {t} from "../lib/strings.js";
import {courseOf} from "../lib/schedule.js";
import {itemCheck} from "../lib/render.js";
import {tabOf, defaultTab, sectionShown} from "../lib/tabs.js";
import ScheduleView from "./schedule/ScheduleView.vue";
import CalendarView from "./calendar/CalendarView.vue";
import PlanView from "./plan/PlanView.vue";
import DirectoryView from "./plan/DirectoryView.vue";
import NewsList from "./sections/NewsList.vue";
import TodoCards from "./sections/TodoCards.vue";
import CheckList from "./sections/CheckList.vue";
import TableSection from "./sections/TableSection.vue";
import CourseSection from "./sections/CourseSection.vue";
import "../styles/sections.css";

const props = defineProps({sec: Object, D: Object});
const hub = inject("hub");
const st = hub.store(props.sec._scope), done = reactive(st.done), save = st.save; // reactive Set: ticks update the progress chip
const id = props.sec.id || props.sec._i;
const course = props.sec.kind === "course" ? courseOf(props.D, props.sec.course) : null;
const title = props.sec.title || (course ? course.title : "");
const builtin = props.sec.kind === "schedule" || props.sec.kind === "calendar";
const isTodo = props.sec.kind === "list" && (props.sec.tab || defaultTab(props.sec)) === "todo";
// "on": the shell mounts only the current tab's sections
const cls = computed(() => ["on", {[`course c-${course && course.color || "grey"}`]: course, todo: props.sec.highlight, "custom builtin": builtin}]);
const total = (props.sec.items || []).filter(itemCheck).length;
const progress = computed(() => t("todo.progress", {done: (props.sec.items || []).filter((it, i) => itemCheck(it) && done.has(`${id}:${i}`)).length, total}));
</script>

<template>
  <section v-if="sectionShown(D, sec)" :class="cls" :data-tab="tabOf(D, sec)" :data-pinned="sec.pinned ? '1' : null">
    <h2><span v-html="title"></span><template v-if="isTodo && total">{{ " " }}<span class="tprog">{{ progress }}</span></template></h2>
    <div v-if="sec.kind === 'schedule'"><ScheduleView :D="D" /></div>
    <div v-else-if="sec.kind === 'calendar'"><CalendarView :D="D" :base="hub.base" /></div>
    <PlanView v-else-if="sec.kind === 'studyplan'" :D="D" />
    <DirectoryView v-else-if="sec.kind === 'directory'" :D="D" />
    <TableSection v-else-if="sec.kind === 'table'" :sec="sec" />
    <TodoCards v-else-if="isTodo" :sec="sec" :id="id" :done="done" :save="save" />
    <CourseSection v-else-if="sec.kind === 'course'" :sec="sec" :id="id" :done="done" :save="save" :D="D" />
    <NewsList v-else-if="sec.kind === 'news'" :items="sec.items" :D="D" />
    <CheckList v-else :sec="sec" :id="id" :done="done" :save="save" :D="D" />
  </section>
</template>
