<script setup>
import {computed} from "vue";
import {parseDate, fmtLong} from "../../lib/util.js";
import {dayClass, dayTip} from "../../lib/calendar.js";
import {useModal} from "../../composables/useModal.js";
// One calendar day: a button that opens the day modal. `st` = dayState(), `extra` = additional class (week view: "wday").
const props = defineProps({semester: {type: Object, required: true}, st: {type: Object, required: true}, k: {type: String, required: true}, today: {type: String, required: true}, extra: {type: String, default: ""}});
const {openDayModal} = useModal();
const tip = computed(() => dayTip(props.st));
const cls = computed(() => dayClass(props.st, props.k, props.today) + props.extra);
const label = computed(() => fmtLong(parseDate(props.k)) + (tip.value ? " · " + tip.value : ""));
</script>

<template>
  <button
type="button" :class="cls" :data-k="k" :aria-label="label" :title="tip || null" :aria-current="k === today ? 'date' : null"
    @click="openDayModal(semester, k, $event.currentTarget)"><slot /></button>
</template>

<style src="../../styles/calendar.css"></style>
