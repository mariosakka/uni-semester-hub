<script setup>
import {ITEMS} from "../../lib/render.js";
import RichText from "../RichText.vue";

// plain lists (links, contacts, other lists)
const props = defineProps({
  sec: {type: Object, required: true},
  semester: {type: Object, required: true}
});
const items = props.sec.items || [], fmt = ITEMS[props.sec.kind] || ITEMS.list;
</script>

<template>
  <ul :class="{ctl: sec.kind === 'contacts'}">
    <li v-for="(it, i) in items" :key="i"><RichText :html="fmt(it, props.semester)" /></li>
  </ul>
</template>
