<script setup>
import {computed} from "vue";
import {t} from "../../lib/strings.js";
import {addDays, fmtDate} from "../../lib/util.js";

const props = defineProps({
  weeks: {type: Array, required: true}, // the timeline
  index: {type: Number, required: true}, // shown entry
  current: {type: Number, required: true}, // entry of the current week
  live: {type: Boolean, default: false} // today lies inside the timeline
});
defineEmits(["go", "ics"]);

// previous / next week, "this week" chip, back-to-current and the .ics download
const e = computed(() => props.weeks[props.index]);
const title = computed(() => e.value.w ? t(e.value.w % 2 ? "schedule.weekOdd" : "schedule.weekEven", {n: e.value.w}) : e.value.label);
</script>

<template>
  <div class="swk">
    <button id="pw" :aria-label="t('schedule.prev')" :disabled="index <= 0" @click="$emit('go', index - 1)">◀</button>
    <b>{{ title }} · {{ fmtDate(e.m) }} – {{ fmtDate(addDays(e.m, 4)) }}</b>
    <span v-if="index === current && live" class="chip">{{ t('schedule.thisWeek') }}</span>
    <button id="nw" :aria-label="t('schedule.next')" :disabled="index >= weeks.length - 1" @click="$emit('go', index + 1)">▶</button>
    <button v-if="index !== current" id="tw" @click="$emit('go', current)">{{ t('schedule.backToCurrent') }}</button>
    <button id="ics" @click="$emit('ics')">{{ t('schedule.download') }}</button>
  </div>
</template>
