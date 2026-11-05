<script>
import {t} from "../../lib/strings.js";
import {people, peopleLine} from "../../lib/plan.js";

export default {
  props: {D: Object},
  computed: {
    prog() { return (this.D.sections || []).filter(s => s.kind === "contacts").flatMap(s => s.items || []); },
    subj() { return (this.D.courses || []).filter(c => people(c).length); }
  },
  // contact markup (mailto/tel links) comes from the shared contacts formatter, as in the course cards
  methods: {t, people, line: p => peopleLine([p])}
};
</script>

<template>
  <template v-if="prog.length || subj.length">
    <template v-if="prog.length"><h3>{{ t('plan.programme') }}</h3><ul><li v-for="(p, i) in prog" :key="i" v-html="line(p)"></li></ul></template>
    <template v-if="subj.length"><h3>{{ t('plan.bySubject') }}</h3>
      <template v-for="(c, i) in subj" :key="i"><h4>{{ c.title }}</h4><ul><li v-for="(p, j) in people(c)" :key="j" v-html="line(p)"></li></ul></template>
    </template>
  </template>
  <p v-else class="note">{{ t('plan.noContacts') }}</p>
</template>
