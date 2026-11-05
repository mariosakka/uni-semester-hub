<script setup>
import {computed} from "vue";
import {t} from "../../lib/strings.js";
import {parseDate, fmtDate} from "../../lib/util.js";
import {courseOf} from "../../lib/schedule.js";
import RichText from "../RichText.vue";

const props = defineProps({
  items: {type: Array, default: () => []},
  semester: {type: Object, required: true}
});

// "new" = dated within the last 7 days (local dates, future-dated items are not new)
const rows = computed(() => {
  const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return [...props.items].sort((a, b) => b.date.localeCompare(a.date)).map((it, i) => { // stable: ties keep file order
    const d = parseDate(it.date), age = Math.round((today - d) / 864e5);
    return {key: `${it.date}:${i}`, it, date: fmtDate(d) + (d.getFullYear() === now.getFullYear() ? "" : ` ${d.getFullYear()}`), isNew: age >= 0 && age <= 7, c: it.course ? courseOf(props.semester, it.course) : null};
  });
});
</script>

<template>
  <ul class="news">
    <li v-for="r in rows" :key="r.key">
      <time class="nd" :datetime="r.it.date">{{ r.date }}</time>
      <div class="nb"><RichText tag="b" :html="r.it.title" />
        <template v-if="r.isNew"> <span class="tag off">{{ t("news.new") }}</span></template>
        <RichText v-if="r.it.text" tag="div" class="nt" :html="r.it.text" />
        <template v-if="r.it.source"> <span class="tag">{{ r.it.source }}</span></template>
        <template v-if="r.it.unconfirmed"> <span class="tag unc">{{ t("news.unconfirmed") }}</span></template>
        <template v-if="r.c"> <span :class="['tag', 'ctag', 'c-' + (r.c.color || 'grey')]">{{ r.c.short || r.c.title }}</span></template>
      </div>
    </li>
  </ul>
</template>
