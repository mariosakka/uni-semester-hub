<script>
import SessionCard from "./SessionCard.vue";

// Cards wrap their text; the hour rows grow (CSS variable --rh) until every card fits, so nothing is cut off.
// Measuring needs the grid to be visible (it is hidden on other tabs and on phones, where the agenda shows), so a
// ResizeObserver re-fits when the grid is shown or its width changes; fonts loading changes line breaks too.
const BASE_RH = 64, MAX_RH = 240;

export default {
  components: {SessionCard},
  props: {D: Object, days: Array, sess: Array, lanes: Object, H0: Number, H1: Number},
  emits: ["open"],
  computed: {
    hours() { return Array.from({length: this.H1 - this.H0}, (_, k) => this.H0 + k); },
    colH() { return `height:calc(var(--rh) * ${this.H1 - this.H0})`; }
  },
  methods: {
    onDay(d) { return this.sess.filter(s => s.day === d); },
    fit() {
      const grid = this.$refs.grid;
      if (!grid || !grid.clientWidth) return; // not visible now
      grid.style.setProperty("--rh", BASE_RH + "px");
      let rh = BASE_RH;
      grid.querySelectorAll(".ev").forEach(ev => { rh = Math.max(rh, Math.ceil((ev.scrollHeight + 5) / (+ev.dataset.dur || 1))); });
      grid.style.setProperty("--rh", Math.min(rh, MAX_RH) + "px");
    }
  },
  mounted() {
    let lastW = -1;
    if (window.ResizeObserver) {
      this.ro = new ResizeObserver(() => { const w = this.$refs.grid.clientWidth; if (w !== lastW) { lastW = w; this.fit(); } });
      this.ro.observe(this.$refs.grid);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => this.$refs.grid && this.fit());
    this.fit();
  },
  updated() { this.fit(); },
  beforeUnmount() { if (this.ro) this.ro.disconnect(); }
};
</script>

<template>
  <div ref="grid" class="sched">
    <div class="sh"></div>
    <div v-for="d in days" :key="d.k" class="sh">{{ d.name }} {{ d.date }}</div>
    <div class="sc times" :style="colH"><div v-for="h in hours" :key="h">{{ h }}:00</div></div>
    <div v-for="d in days" :key="d.k" :class="['sc', d.off && 'off']" :style="colH">
      <div v-if="d.off" class="dayoff">{{ d.off }}</div>
      <SessionCard v-for="s in onDay(d.k)" :key="[s.course, s.type, s.group, s.key, s.start].join()" :s="s" :D="D" kind="ev" :lane="lanes.get(s)" :H0="H0" @open="(x, el) => $emit('open', x, el)" />
    </div>
  </div>
</template>
