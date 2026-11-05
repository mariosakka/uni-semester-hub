<script setup>
import {computed} from "vue";
import {parseDate, fmtLong} from "../../lib/util.js";
import {dayClass, dayTip} from "../../lib/calendar.js";
import {openDayModal} from "../../lib/shared.js";
// One calendar day: a button that opens the day modal. `st` = dayState(), `extra` = additional class (week view: "wday").
const props = defineProps({D: Object, st: Object, k: String, today: String, extra: {type: String, default: ""}});
const tip = computed(() => dayTip(props.st));
const cls = computed(() => dayClass(props.st, props.k, props.today) + props.extra);
const label = computed(() => fmtLong(parseDate(props.k)) + (tip.value ? " · " + tip.value : ""));
</script>

<template>
  <button type="button" :class="cls" :data-k="k" :aria-label="label" :title="tip || null" :aria-current="k === today ? 'date' : null"
    @click="openDayModal(D, k, $event.currentTarget)"><slot/></button>
</template>

<style src="../../styles/calendar.css"></style>
