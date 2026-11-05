<script setup>
import {reactive} from "vue";
import {t} from "../../lib/strings.js";
import {itemCheck, itemTitle} from "../../lib/render.js";

// done: reactive Set of ticked ids (owned by SectionView); ids stay `${section id}:${item index}`
const props = defineProps({sec: Object, id: [String, Number], done: Object, save: Function});
const items = props.sec.items || [], base = `tc${props.sec._scope || ""}-${props.id}`.replace(/[^\w-]/g, "_");
const key = i => `${props.id}:${i}`;
const obj = it => typeof it === "object" && it !== null;
const text = it => obj(it) && it.text ? it.text : "";
const isDone = (it, i) => itemCheck(it) && props.done.has(key(i));
// done cards start closed, `open: true` starts a card open; closed cards keep their text in the DOM (hidden) so the filter still matches it
const open = reactive(items.map((it, i) => !!text(it) && it.open === true && !isDone(it, i)));
const toggle = i => { open[i] = !open[i]; };
const tick = (i, e) => {
  e.target.checked ? props.done.add(key(i)) : props.done.delete(key(i));
  if (e.target.checked) open[i] = false;
  props.save();
};
const onTitle = (i, e) => { if (text(items[i]) && !e.target.closest("a")) toggle(i); };
const plain = it => itemTitle(it).replace(/<[^>]*>/g, "").trim();
</script>

<template>
  <ul class="tcards">
    <li v-for="(it, i) in items" :key="i" :class="['tcard', itemCheck(it) ? 'task' : 'info', {hasbody: text(it), done: isDone(it, i), open: open[i]}]">
      <div class="tc-head">
        <label v-if="itemCheck(it)" class="tc-hit"><input type="checkbox" :aria-labelledby="`${base}-${i}-t`" :checked="isDone(it, i)" @change="tick(i, $event)"></label>
        <span v-else class="tc-ico" aria-hidden="true"></span>
        <span class="tc-title" :id="`${base}-${i}-t`" @click="onTitle(i, $event)"><span v-html="itemTitle(it)"></span><template v-if="obj(it) && it.due"> <span class="tc-due">{{ it.due }}</span></template></span>
        <button v-if="text(it)" type="button" class="tc-chev" :aria-expanded="String(open[i])" :aria-controls="`${base}-${i}-b`"
          :aria-label="t('todo.details', {title: plain(it)})" @click="toggle(i)"></button>
      </div>
      <div v-if="text(it)" class="tc-body" :id="`${base}-${i}-b`" :hidden="!open[i]" v-html="text(it)"></div>
    </li>
  </ul>
</template>
