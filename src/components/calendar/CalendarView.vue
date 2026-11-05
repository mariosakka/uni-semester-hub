<script setup>
import {reactive, computed} from "vue";
import {t, tx} from "../../lib/strings.js";
import {esc, iso, addDays, fmtDate, monthName} from "../../lib/util.js";
import {CAL_MODES, calRange, clampDate, mondayOfDate, nearestMonth} from "../../lib/calendar.js";
import RichText from "../RichText.vue";
import MonthGrid from "./MonthGrid.vue";
import WeekGrid from "./WeekGrid.vue";
import YearView from "./YearView.vue";
// Week / Month / Year over the semester's calendar. base = folder of the data set (optional image / pdf paths).
const props = defineProps({semester: {type: Object, required: true}, base: {type: String, default: ""}});
const D = props.semester, C = D.calendar || {}, [lo, hi] = calRange(D), now = new Date(), today = iso(now);
const S = reactive({mode: "month", anchor: clampDate(now, lo, hi)});

const v = computed(() => {
  const a = S.anchor;
  if (S.mode === "week") {
    const st = mondayOfDate(a);
    return {title: `${fmtDate(st)} – ${fmtDate(addDays(st, 6))}`, st, atStart: addDays(st, -1) < lo, atEnd: addDays(st, 7) > hi};
  }
  if (S.mode === "month") {
    const [y, m] = nearestMonth(D, a);
    return {title: `${monthName(y, m)} ${y}`, y, m, atStart: new Date(y, m, 0) < lo, atEnd: new Date(y, m + 1, 1) > hi};
  }
  return {title: (D.year || {}).title || ""};
});
function go(dir) {
  const a = S.anchor, [y, m] = nearestMonth(D, a);
  S.anchor = clampDate(S.mode === "week" ? addDays(a, 7 * dir) : new Date(y, m + dir, 1), lo, hi);
}
const docLink = tx("calendar.officialDoc", {link: C.pdf ? `<a href="${esc(props.base + C.pdf)}">${esc(C.pdf)}</a>` : ""});
</script>

<template>
    <div class="cmodes" role="group" :aria-label="t('calendar.modes')">
      <button v-for="[k, key] in CAL_MODES" :key="k" type="button" :data-mode="k" :aria-pressed="String(k === S.mode)" @click="S.mode = k">{{ t(key) }}</button>
    </div>
    <div v-if="S.mode === 'year'" class="cnav"><b>{{ v.title }}</b></div>
    <div v-else class="cnav">
      <button type="button" data-nav="-1" :disabled="v.atStart" :aria-label="t('calendar.prev')" @click="go(-1)">◀</button><b>{{ v.title }}</b><button type="button" data-nav="1" :disabled="v.atEnd" :aria-label="t('calendar.next')" @click="go(1)">▶</button>
      <button type="button" data-today @click="S.anchor = clampDate(new Date(), lo, hi)">{{ t("calendar.today") }}</button>
    </div>
    <div class="legend"><span class="d teach">{{ t("calendar.legend.teaching") }}</span><span class="d exam">{{ t("calendar.legend.exams") }}</span><span class="d off">{{ t("calendar.legend.dayOff") }}</span><span class="d key task">{{ t("calendar.legend.task") }}</span><span class="d key exam">{{ t("calendar.legend.keyExam") }}</span></div>
    <div class="cbody">
      <WeekGrid v-if="S.mode === 'week'" :semester="D" :start="v.st" :today="today" />
      <div v-else-if="S.mode === 'month'" class="months one"><MonthGrid :semester="D" :src="D" :y="v.y" :m="v.m" :today="today" /></div>
      <YearView v-else :semester="D" :today="today" />
    </div>
    <RichText v-if="C.note" tag="p" class="note" :html="C.note" />
    <a v-if="C.image" :href="base + (C.pdf || C.image)"><img class="calimg" :src="base + C.image" :alt="t('calendar.imageAlt')"></a>
    <RichText v-if="C.pdf" tag="p" class="note" :html="docLink" />
</template>
