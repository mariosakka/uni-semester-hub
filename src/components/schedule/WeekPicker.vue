<script>
import {t} from "../../lib/strings.js";
import {addDays, fmtDate} from "../../lib/util.js";

// previous / next week, "this week" chip, back-to-current and the .ics download; i = index into the timeline T
export default {
  props: {T: Array, i: Number, real: Number, live: Boolean},
  emits: ["go", "ics"],
  methods: {t, fmtDate, addDays},
  computed: {
    e() { return this.T[this.i]; },
    title() { const e = this.e; return e.w ? t(e.w % 2 ? "schedule.weekOdd" : "schedule.weekEven", {n: e.w}) : e.label; }
  }
};
</script>

<template>
  <div class="swk">
    <button id="pw" :aria-label="t('schedule.prev')" :disabled="i <= 0" @click="$emit('go', i - 1)">◀</button>
    <b>{{ title }} · {{ fmtDate(e.m) }} – {{ fmtDate(addDays(e.m, 4)) }}</b>
    <span v-if="i === real && live" class="chip">{{ t('schedule.thisWeek') }}</span>
    <button id="nw" :aria-label="t('schedule.next')" :disabled="i >= T.length - 1" @click="$emit('go', i + 1)">▶</button>
    <button v-if="i !== real" id="tw" @click="$emit('go', real)">{{ t('schedule.backToCurrent') }}</button>
    <button id="ics" @click="$emit('ics')">{{ t('schedule.download') }}</button>
  </div>
</template>
