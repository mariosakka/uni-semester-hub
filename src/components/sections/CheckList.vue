<script setup>
import {itemCheck, ITEMS} from "../../lib/render.js";
import RichText from "../RichText.vue";

// plain lists (links, contacts, other lists): only kind "list" has tickable items; ids `${section id}:${item index}`
const props = defineProps({
  sec: {type: Object, required: true},
  id: {type: [String, Number], required: true},
  done: {type: Object, required: true},
  semester: {type: Object, required: true}
});
const emit = defineEmits(["toggle"]);
const items = props.sec.items || [], fmt = ITEMS[props.sec.kind] || ITEMS.list;
const key = i => `${props.id}:${i}`;
const tickable = it => props.sec.kind === "list" && itemCheck(it);
</script>

<template>
  <ul>
    <li v-for="(it, i) in items" :key="key(i)" :class="tickable(it) ? ['check', {done: done.has(key(i))}] : null">
      <label v-if="tickable(it)"><input type="checkbox" :checked="done.has(key(i))" @change="emit('toggle', key(i), $event.target.checked)"> <RichText :html="fmt(it, props.semester)" /></label>
      <RichText v-else :html="fmt(it, props.semester)" />
    </li>
  </ul>
</template>
