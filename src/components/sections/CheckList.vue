<script setup>
import {itemCheck, ITEMS} from "../../lib/render.js";

// plain lists (links, contacts, other lists): only kind "list" has tickable items; ids `${section id}:${item index}`
const props = defineProps({sec: Object, id: [String, Number], done: Object, save: Function, D: Object});
const items = props.sec.items || [], fmt = ITEMS[props.sec.kind] || ITEMS.list;
const key = i => `${props.id}:${i}`;
const tickable = it => props.sec.kind === "list" && itemCheck(it);
const tick = (i, e) => { e.target.checked ? props.done.add(key(i)) : props.done.delete(key(i)); props.save(); };
</script>

<template>
  <ul>
    <li v-for="(it, i) in items" :key="i" :class="tickable(it) ? ['check', {done: done.has(key(i))}] : null">
      <label v-if="tickable(it)"><input type="checkbox" :checked="done.has(key(i))" @change="tick(i, $event)"> <span v-html="fmt(it, D)"></span></label>
      <span v-else v-html="fmt(it, D)"></span>
    </li>
  </ul>
</template>
