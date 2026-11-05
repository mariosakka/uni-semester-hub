<script>
import {t} from "../../lib/strings.js";
import SessionCard from "./SessionCard.vue";

// phone layout: the same sessions as a day-by-day list (CSS shows the grid or the agenda, never both)
export default {
  components: {SessionCard},
  props: {D: Object, days: Array, sess: Array},
  emits: ["open"],
  methods: {
    t,
    list(k) { return this.sess.filter(s => s.day === k).sort((x, y) => x.start - y.start); }
  }
};
</script>

<template>
  <div class="agenda">
    <div v-for="d in days" :key="d.k" :class="['ag', d.off && 'off']">
      <h3>{{ d.name }} {{ d.date }} <span v-if="d.off" class="agoff">{{ d.off }}</span></h3>
      <SessionCard v-for="s in list(d.k)" :key="[s.course, s.type, s.group, s.key, s.start].join()" :s="s" :D="D" kind="acard" @open="(x, el) => $emit('open', x, el)" />
      <p v-if="!d.off && !list(d.k).length" class="note">{{ t('schedule.noClasses') }}</p>
    </div>
  </div>
</template>
