<script setup>
import {computed} from "vue";
import {t} from "../../lib/strings.js";
import {discoverGroups, groupFor, groupSummary, setGroup, setAllGroups, resetGroups} from "../../lib/groups.js";
import {courseOf} from "../../lib/schedule.js";
import {useSubgroupSync} from "../../composables/useSubgroupSync.js";
import {useGroupPanel} from "../../composables/useGroupPanel.js";

// subgroup chooser: a disclosure under the week row (inline on wide screens, a bottom sheet on phones, see CSS)
const props = defineProps({semester: {type: Object, required: true}});
const {tick, bump} = useSubgroupSync();
const {open, btn, panel, close, toggle} = useGroupPanel(() => props.semester);

const rows = computed(() => { tick.value; return discoverGroups(props.semester).map(g => ({...g, c: courseOf(props.semester, g.course), cur: groupFor(props.semester, g.course)})); });
const all = computed(() => [...new Set(rows.value.flatMap(g => g.groups))].sort());
const summary = computed(() => { tick.value; return groupSummary(props.semester); });
function pick(course, value) { setGroup(props.semester, course, value); bump(); }
function preset(p) { if (p === "reset") resetGroups(props.semester); else setAllGroups(props.semester, p); bump(); }
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
