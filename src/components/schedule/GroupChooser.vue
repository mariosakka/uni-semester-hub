<script>
import {t} from "../../lib/strings.js";
import {groupTick} from "../../lib/shared.js";
import {discoverGroups, groupFor, groupSummary, setGroup, setAllGroups, resetGroups} from "../../lib/groups.js";
import {courseOf} from "../../lib/schedule.js";

// subgroup chooser: a disclosure under the week row (inline on wide screens, a bottom sheet on phones, see CSS)
export default {
  props: {D: Object},
  data() { return {open: !!this.D._gopen}; },
  methods: {
    t,
    set(on) { this.open = on; this.D._gopen = on; },
    toggle() { this.set(!this.open); if (this.open) this.$nextTick(() => { const s = this.$refs.panel.querySelector("select"); if (s) s.focus(); }); },
    close(refocus) { if (!this.open) return; this.set(false); if (refocus) this.$refs.btn.focus(); },
    pick(course, value) { setGroup(this.D, course, value); groupTick.value++; },
    preset(p) { if (p === "reset") resetGroups(this.D); else setAllGroups(this.D, p); groupTick.value++; },
    onKey(e) { if (e.key === "Escape") this.close(true); },
    onClick(e) { if (!e.target.closest(".gwrap")) this.close(false); }
  },
  computed: {
    rows() { groupTick.value; return discoverGroups(this.D).map(g => ({...g, c: courseOf(this.D, g.course), cur: groupFor(this.D, g.course)})); },
    all() { return [...new Set(this.rows.flatMap(g => g.groups))].sort(); },
    summary() { groupTick.value; return groupSummary(this.D); }
  },
  mounted() { document.addEventListener("keydown", this.onKey); document.addEventListener("click", this.onClick); },
  beforeUnmount() { document.removeEventListener("keydown", this.onKey); document.removeEventListener("click", this.onClick); }
};
</script>

<template>
  <div v-if="rows.length" class="gwrap">
    <button id="gbtn" ref="btn" type="button" :aria-expanded="open ? 'true' : 'false'" aria-controls="gpanel" @click="toggle">{{ t('schedule.groups.button') }}</button>
    <span class="chip gchip">{{ summary }}</span>
    <div id="gpanel" ref="panel" class="gpanel" role="group" :aria-label="t('schedule.groups.title')" :hidden="!open">
      <h3>{{ t('schedule.groups.title') }}</h3>
      <label v-for="g in rows" :key="g.course" :class="'grow c-' + (g.c.color || 'grey')">
        <span>{{ g.c.short || g.c.title }}</span>
        <select :data-c="g.course" :value="g.cur" @change="pick(g.course, $event.target.value)">
          <option value="all">{{ t('schedule.groups.all') }}</option>
          <option v-for="v in g.groups" :key="v" :value="v">{{ t('schedule.groups.option', {n: v}) }}</option>
        </select>
      </label>
      <div class="gpre">
        <button type="button" data-p="all" @click="preset('all')">{{ t('schedule.groups.presetAll') }}</button>
        <button v-for="v in all" :key="v" type="button" :data-p="v" @click="preset(v)">{{ t('schedule.groups.presetN', {n: v}) }}</button>
        <button type="button" data-p="reset" @click="preset('reset')">{{ t('schedule.groups.reset') }}</button>
      </div>
      <button id="gclose" type="button" @click="close(true)">{{ t('schedule.groups.close') }}</button>
    </div>
  </div>
</template>
