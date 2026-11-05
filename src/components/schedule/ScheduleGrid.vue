<script setup>
import {ref, computed} from "vue";
import {useResizeFit} from "../../composables/useResizeFit.js";
import SessionCard from "./SessionCard.vue";

// Cards wrap their text; the hour rows grow (CSS variable --rh) until every card fits, so nothing is cut off.
// Measuring needs the grid to be visible (it is hidden on other tabs and on phones, where the agenda shows), so a
// ResizeObserver re-fits when the grid is shown or its width changes; fonts loading changes line breaks too.

const props = defineProps({
  semester: {type: Object, required: true},
  days: {type: Array, required: true},
  sess: {type: Array, required: true},
  lanes: {type: Object, required: true}, // Map session -> [lane, lane count]
  h0: {type: Number, required: true},
  h1: {type: Number, required: true}
});
const emit = defineEmits(["open"]);
const BASE_RH = 64, MAX_RH = 240;

const grid = ref(null);
const hours = computed(() => Array.from({length: props.h1 - props.h0}, (_, k) => props.h0 + k));
const colH = computed(() => `height:calc(var(--rh) * ${props.h1 - props.h0})`);
const onDay = d => props.sess.filter(s => s.day === d);

function fit() {
  const g = grid.value;
  if (!g || !g.clientWidth) return; // not visible now
  g.style.setProperty("--rh", BASE_RH + "px");
  let rh = BASE_RH;
  g.querySelectorAll(".ev").forEach(ev => { rh = Math.max(rh, Math.ceil((ev.scrollHeight + 5) / (+ev.dataset.dur || 1))); });
  g.style.setProperty("--rh", Math.min(rh, MAX_RH) + "px");
}
useResizeFit(grid, fit);
</script>

<template>
  <div ref="grid" class="sched">
    <div class="sh"></div>
    <div v-for="d in days" :key="d.k" class="sh">{{ d.name }} {{ d.date }}</div>
    <div class="sc times" :style="colH"><div v-for="h in hours" :key="h">{{ h }}:00</div></div>
    <div v-for="d in days" :key="d.k" :class="['sc', d.off && 'off']" :style="colH">
      <div v-if="d.off" class="dayoff">{{ d.off }}</div>
      <SessionCard v-for="s in onDay(d.k)" :key="[s.course, s.type, s.group, s.key, s.start].join()" :s="s" :semester="semester" kind="ev" :lane="lanes.get(s)" :h0="h0" @open="(x, el) => emit('open', x, el)" />
    </div>
  </div>
</template>
