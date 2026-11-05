<script setup>
import {computed} from "vue";
import {t} from "../../lib/strings.js";
import {fmtLong, fmtTime} from "../../lib/util.js";
import {EVAL, evalCode} from "../../lib/plan.js";
import {cap} from "../../lib/daymodal.js";
import {useModal} from "../../composables/useModal.js";
// Session modal content (rows from sessionInfo()); "Open day" swaps to that day's modal, focus still returns to the original opener.
const props = defineProps({info: {type: Object, required: true}, semester: {type: Object, required: true}, opener: {type: Element, default: null}});
const {openDayModal} = useModal();
const st = computed(() => ({cancel: ["cxs", "✕ " + t("modal.notHeld")], extra: ["", t("modal.extra")], dev: ["unc", "⚠ " + t("modal.differs")], ok: ["", t("session.ok")]}[props.info.status]));
const subject = computed(() => {
  const c = props.info.course, ev = EVAL[evalCode(c)], bits = [];
  if (c.ects) bits.push(t("session.credits", {n: c.ects}));
  if (c.evaluation) bits.push(t("course.evaluation", {value: ev ? t(ev[1]) + " (" + evalCode(c) + ")" : c.evaluation}));
  return bits.join(" · ");
});
</script>

<template>
  <dl class="sm-dl">
    <dt>{{ t("session.type") }}</dt><dd>{{ cap(info.typeName) }}{{ info.group ? " · " + t("schedule.subgroup", {n: info.group}) : "" }}</dd>
    <dt>{{ t("session.when") }}</dt><dd>{{ fmtLong(info.date) }}, {{ fmtTime(info.start) }}–{{ fmtTime(info.end) }}</dd>
    <template v-if="info.week"><dt>{{ t("session.week") }}</dt><dd>{{ t(info.parity === "odd" ? "schedule.weekOdd" : "schedule.weekEven", {n: info.week}) }}</dd></template>
    <template v-if="info.status !== 'cancel'"><dt>{{ t("session.place") }}</dt><dd>{{ info.modeDiffers ? t("session.modeDiffers", {now: info.place, base: info.basePlace}) : info.place }}</dd></template>
    <dt>{{ t("session.status") }}</dt><dd><span :class="['tag', st[0]]">{{ st[1] }}</span></dd>
    <template v-if="info.note"><dt>{{ t("session.note") }}</dt><dd>{{ info.note }}<template v-if="info.u"> <span class="tag unc">{{ t("news.unconfirmed") }}</span></template></dd></template>
    <template v-if="info.teacher"><dt>{{ t("session.teacher") }}</dt><dd>{{ info.teacher }}</dd></template>
    <template v-if="subject"><dt>{{ t("session.subject") }}</dt><dd>{{ subject }}</dd></template>
  </dl>
  <p><button type="button" class="dm-open" @click="openDayModal(semester, info.key, opener)">{{ t("session.openDay") }}</button></p>
</template>
