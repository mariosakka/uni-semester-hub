<script setup>
import {computed} from "vue";
import {t} from "../../lib/strings.js";
import {people, peopleLine} from "../../lib/plan.js";
import RichText from "../RichText.vue";

const props = defineProps({semester: {type: Object, required: true}});
const prog = computed(() => (props.semester.sections || []).filter(s => s.kind === "contacts").flatMap(s => s.items || []));
const subj = computed(() => (props.semester.courses || []).filter(c => people(c).length));
// contact markup (mailto/tel links) comes from the shared contacts formatter, as in the course cards
const line = p => peopleLine([p]);
</script>

<template>
  <template v-if="prog.length || subj.length">
    <template v-if="prog.length"><h3>{{ t('plan.programme') }}</h3><ul class="ctl"><RichText v-for="(p, i) in prog" :key="i" tag="li" :html="line(p)" /></ul></template>
    <template v-if="subj.length"><h3>{{ t('plan.bySubject') }}</h3>
      <template v-for="(c, i) in subj" :key="c.id || i"><h4>{{ c.title }}</h4><ul class="ctl"><RichText v-for="(p, j) in people(c)" :key="j" tag="li" :html="line(p)" /></ul></template>
    </template>
  </template>
  <p v-else class="note">{{ t('plan.noContacts') }}</p>
</template>
