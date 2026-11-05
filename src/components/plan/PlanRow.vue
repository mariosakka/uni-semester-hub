<script setup>
import {computed, ref} from "vue";
import {t} from "../../lib/strings.js";
import {EVAL, HOURS, evalCode, hoursSum, barPct} from "../../lib/plan.js";

// One subject = a <tbody class="prow"> (main row + hidden detail row): the search filter treats it as one unit.
const props = defineProps({
  c: {type: Object, required: true},
  i: {type: Number, required: true},
  maxEcts: {type: Number, default: 10}
});
const open = ref(false);
const id = computed(() => `pd-${props.i}`);
const ev = computed(() => EVAL[evalCode(props.c)]);
const hrs = computed(() => HOURS.filter(([k]) => +(props.c.hours || {})[k] > 0));
const tot = computed(() => hoursSum(props.c.hours));
const comps = computed(() => (props.c.grading || {}).components || []);
const teachers = computed(() => props.c.teachers || []);
const g = computed(() => props.c.grading);
const total = computed(() => comps.value.reduce((n, x) => n + (+x.weight || 0), 0));
const allW = computed(() => comps.value.length && comps.value.every(x => x.weight != null));
</script>

<template>
  <tbody :class="['prow', 'c-' + (c.color || 'grey')]">
    <tr class="pm">
      <td class="psub" :data-label="t('plan.col.subject')">
        <button type="button" class="ptog" :aria-expanded="String(open)" :aria-controls="id" @click="open = !open">{{ c.title }}</button>
        <p v-if="c.description" class="pdesc">{{ c.description }}</p>
      </td>
      <td class="pe" :data-label="t('plan.col.ects')">
        <template v-if="+c.ects"><span class="ppill">{{ c.ects }}</span><span class="pbar" aria-hidden="true"><i :style="{width: barPct(c.ects, maxEcts) + '%'}"></i></span></template>
        <template v-else>{{ t('plan.unknown') }}</template>
      </td>
      <td class="pv" :data-label="t('plan.col.eval')">
        <template v-if="!c.evaluation">{{ t('plan.unknown') }}</template>
        <span v-else-if="ev" :class="'pev ' + ev[0]"><b>{{ evalCode(c) }}</b> {{ t(ev[1]) }}</span>
        <span v-else class="pev oth">{{ c.evaluation }}</span>
      </td>
      <td class="ph" :data-label="t('plan.col.hours')">
        <template v-if="hrs.length">
          <span v-for="[k, a, n] in hrs" :key="k" class="hc" role="img" :aria-label="t('plan.hoursChip', {kind: t(n), n: c.hours[k]})" :title="t('plan.hoursChip', {kind: t(n), n: c.hours[k]})">{{ t(a) }}{{ c.hours[k] }}</span><span class="htot">{{ t('plan.hoursTotalShort', {n: tot}) }}</span>
        </template>
        <template v-else>{{ t('plan.unknown') }}</template>
      </td>
      <td class="pg" :data-label="t('plan.col.grading')">
        <template v-if="comps.length"><span v-for="(x, j) in comps" :key="j" class="gchip">{{ x.name }}<template v-if="x.weight != null"> {{ x.weight }}%</template></span></template>
        <template v-else>{{ t('plan.unknown') }}</template>
      </td>
      <td class="pt" :data-label="t('plan.col.teachers')">
        <template v-if="teachers.length"><div v-for="(p, j) in teachers" :key="j">{{ p.name }}<template v-if="p.role">{{ " " }}<span class="prole">({{ p.role }})</span></template></div></template>
        <template v-else>{{ t('plan.unknown') }}</template>
      </td>
    </tr>
    <tr :id="id" class="pd" :hidden="!open">
      <td colspan="6">
        <template v-if="g">
          <div v-if="comps.length" class="tw"><table class="tbl">
            <thead><tr><th>{{ t('plan.component') }}</th><th>{{ t('plan.weight') }}</th><th>{{ t('plan.note') }}</th></tr></thead>
            <tbody><tr v-for="(x, j) in comps" :key="j">
              <td>{{ x.name }}</td>
              <td><template v-if="x.weight != null"><span class="gbar" aria-hidden="true"><i :style="{width: barPct(x.weight, 100) + '%'}"></i></span>{{ x.weight }}%</template><template v-else>{{ t('plan.unknown') }}</template></td>
              <td>{{ x.note || '' }}</td>
            </tr></tbody>
            <tfoot v-if="allW"><tr><td>{{ t('plan.total') }}</td><td colspan="2">{{ total }}%{{ total === 100 ? '' : t('plan.notHundred') }}</td></tr></tfoot>
          </table></div>
          <p v-if="g.passRule"><b>{{ t('plan.passRule') }}</b> {{ g.passRule }}</p>
          <p v-if="g.notes" class="note">{{ g.notes }}</p>
        </template>
        <p v-else class="note">{{ t('plan.noGrading') }}</p>
      </td>
    </tr>
  </tbody>
</template>
