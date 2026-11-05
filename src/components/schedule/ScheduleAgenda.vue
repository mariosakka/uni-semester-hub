<script setup>
import {t} from "../../lib/strings.js";
import SessionCard from "./SessionCard.vue";

// phone layout: the same sessions as a day-by-day list (CSS shows the grid or the agenda, never both)
const props = defineProps({
  semester: {type: Object, required: true},
  days: {type: Array, required: true},
  sess: {type: Array, required: true}
});
const emit = defineEmits(["open"]);
const list = k => props.sess.filter(s => s.day === k).sort((x, y) => x.start - y.start);
</script>

<template>
  <div class="agenda">
    <div v-for="d in days" :key="d.k" :class="['ag', d.off && 'off']">
      <h3>{{ d.name }} {{ d.date }} <span v-if="d.off" class="agoff">{{ d.off }}</span></h3>
      <SessionCard v-for="s in list(d.k)" :key="[s.course, s.type, s.group, s.key, s.start].join()" :s="s" :semester="semester" kind="acard" @open="(x, el) => emit('open', x, el)" />
      <p v-if="!d.off && !list(d.k).length" class="note">{{ t('schedule.noClasses') }}</p>
    </div>
  </div>
</template>
