<script setup>
import {computed} from "vue";
import {courseOf} from "../lib/schedule.js";
import {tabOf, tabsFor, defaultTab, sectionShown} from "../lib/tabs.js";
import {useHub} from "../composables/useHub.js";
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
const id = props.sec.id || props.sec._i;
const course = props.sec.kind === "course" ? courseOf(props.semester, props.sec.course) : null;
const title = props.sec.title || (course ? course.title : "");
// a heading that repeats the page title (tab name) is dropped; its tag chips (e.g. "official") stay
const plain = h => h.replace(/<span class=.tag[^>]*>.*?<\/span>/g, "").replace(/<[^>]*>/g, "").trim().toLowerCase();
const tabTitle = ((tabsFor(props.semester).find(x => x.id === tabOf(props.semester, props.sec))) || {}).title || "";
const dup = plain(title) !== "" && plain(title) === plain(tabTitle);
const tags = (title.match(/<span class=.tag[^>]*>.*?<\/span>/g) || []).join(" ");
const builtin = props.sec.kind === "schedule" || props.sec.kind === "calendar";
const isTodo = props.sec.kind === "list" && (props.sec.tab || defaultTab(props.sec)) === "todo";
// "on": the shell mounts only the current tab's sections
const cls = computed(() => ["on", {[`course c-${course && course.color || "grey"}`]: course, todo: props.sec.highlight, "custom builtin": builtin}]);
</script>

<template>
  <section v-if="sectionShown(semester, sec)" :class="cls" :data-tab="tabOf(semester, sec)" :data-pinned="sec.pinned ? '1' : null">
    <RichText v-if="!dup" tag="h2" :html="title" />
    <RichText v-else-if="tags" tag="p" class="chead tagline" :html="tags" />
    <div v-if="sec.kind === 'schedule'"><ScheduleView :semester="semester" /></div>
    <div v-else-if="sec.kind === 'calendar'"><CalendarView :semester="semester" :base="hub.base" /></div>
    <PlanView v-else-if="sec.kind === 'studyplan'" :semester="semester" />
    <DirectoryView v-else-if="sec.kind === 'directory'" :semester="semester" />
    <TableSection v-else-if="sec.kind === 'table'" :sec="sec" />
    <TodoCards v-else-if="isTodo" :id="id" :sec="sec" />
    <CourseSection v-else-if="sec.kind === 'course'" :sec="sec" :semester="semester" />
    <NewsList v-else-if="sec.kind === 'news'" :items="sec.items" :semester="semester" />
    <CheckList v-else :sec="sec" :semester="semester" />
  </section>
</template>
