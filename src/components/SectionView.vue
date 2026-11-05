<script setup>
import {computed} from "vue";
import {t} from "../lib/strings.js";
import {courseOf} from "../lib/schedule.js";
import {itemCheck} from "../lib/render.js";
import {tabOf, defaultTab, sectionShown} from "../lib/tabs.js";
import {useHub} from "../composables/useHub.js";
import {useTicks} from "../composables/useTicks.js";
import ScheduleView from "./schedule/ScheduleView.vue";
import CalendarView from "./calendar/CalendarView.vue";
import PlanView from "./plan/PlanView.vue";
import DirectoryView from "./plan/DirectoryView.vue";
import NewsList from "./sections/NewsList.vue";
import TodoCards from "./sections/TodoCards.vue";
import CheckList from "./sections/CheckList.vue";
import TableSection from "./sections/TableSection.vue";
import CourseSection from "./sections/CourseSection.vue";
import RichText from "./RichText.vue";
import "../styles/sections.css";

const props = defineProps({
  sec: {type: Object, required: true},
  semester: {type: Object, required: true}
});
const hub = useHub();
const {done, toggle} = useTicks(props.sec._scope); // reactive Set: ticks update the progress chip
const id = props.sec.id || props.sec._i;
const course = props.sec.kind === "course" ? courseOf(props.semester, props.sec.course) : null;
const title = props.sec.title || (course ? course.title : "");
const builtin = props.sec.kind === "schedule" || props.sec.kind === "calendar";
const isTodo = props.sec.kind === "list" && (props.sec.tab || defaultTab(props.sec)) === "todo";
// "on": the shell mounts only the current tab's sections
const cls = computed(() => ["on", {[`course c-${course && course.color || "grey"}`]: course, todo: props.sec.highlight, "custom builtin": builtin}]);
const total = (props.sec.items || []).filter(itemCheck).length;
const progress = computed(() => t("todo.progress", {done: (props.sec.items || []).filter((it, i) => itemCheck(it) && done.has(`${id}:${i}`)).length, total}));
</script>

<template>
  <section v-if="sectionShown(semester, sec)" :class="cls" :data-tab="tabOf(semester, sec)" :data-pinned="sec.pinned ? '1' : null">
    <h2><RichText :html="title" /><template v-if="isTodo && total">{{ " " }}<span class="tprog">{{ progress }}</span></template></h2>
    <div v-if="sec.kind === 'schedule'"><ScheduleView :semester="semester" /></div>
    <div v-else-if="sec.kind === 'calendar'"><CalendarView :semester="semester" :base="hub.base" /></div>
    <PlanView v-else-if="sec.kind === 'studyplan'" :semester="semester" />
    <DirectoryView v-else-if="sec.kind === 'directory'" :semester="semester" />
    <TableSection v-else-if="sec.kind === 'table'" :sec="sec" />
    <TodoCards v-else-if="isTodo" :id="id" :sec="sec" :done="done" @toggle="toggle" />
    <CourseSection v-else-if="sec.kind === 'course'" :id="id" :sec="sec" :done="done" :semester="semester" @toggle="toggle" />
    <NewsList v-else-if="sec.kind === 'news'" :items="sec.items" :semester="semester" />
    <CheckList v-else :id="id" :sec="sec" :done="done" :semester="semester" @toggle="toggle" />
  </section>
</template>
