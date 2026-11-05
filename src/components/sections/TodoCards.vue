<script setup>
import {t} from "../../lib/strings.js";
import {itemCheck, itemTitle} from "../../lib/render.js";
import {useTodoCard} from "../../composables/useTodoCard.js";
import RichText from "../RichText.vue";

// done: reactive Set of ticked ids (owned by SectionView); ids stay `${section id}:${item index}`
const props = defineProps({
  sec: {type: Object, required: true},
  id: {type: [String, Number], required: true},
  done: {type: Object, required: true}
});
const emit = defineEmits(["toggle"]);
const items = props.sec.items || [], base = `tc${props.sec._scope || ""}-${props.id}`.replace(/[^\w-]/g, "_");
const key = i => `${props.id}:${i}`;
const obj = it => typeof it === "object" && it !== null;
const text = it => obj(it) && it.text ? it.text : "";
const isDone = (it, i) => itemCheck(it) && props.done.has(key(i));
// closed cards keep their text in the DOM (hidden) so the filter still matches it
const {open, toggle, close} = useTodoCard(items, isDone);
const tick = (i, e) => {
  if (e.target.checked) close(i);
  emit("toggle", key(i), e.target.checked);
};
const onTitle = (i, e) => { if (text(items[i]) && !e.target.closest("a")) toggle(i); };
const plain = it => itemTitle(it).replace(/<[^>]*>/g, "").trim();
</script>

<template>
  <ul class="tcards">
    <li v-for="(it, i) in items" :key="key(i)" :class="['tcard', itemCheck(it) ? 'task' : 'info', {hasbody: text(it), done: isDone(it, i), open: open[i]}]">
      <div class="tc-head">
        <label v-if="itemCheck(it)" class="tc-hit"><input type="checkbox" :aria-labelledby="`${base}-${i}-t`" :checked="isDone(it, i)" @change="tick(i, $event)"></label>
        <span v-else class="tc-ico" aria-hidden="true"></span>
        <span :id="`${base}-${i}-t`" class="tc-title" @click="onTitle(i, $event)"><RichText :html="itemTitle(it)" /><template v-if="obj(it) && it.due"> <span class="tc-due">{{ it.due }}</span></template></span>
        <button
v-if="text(it)" type="button" class="tc-chev" :aria-expanded="String(open[i])" :aria-controls="`${base}-${i}-b`"
          :aria-label="t('todo.details', {title: plain(it)})" @click="toggle(i)"></button>
      </div>
      <RichText v-if="text(it)" :id="`${base}-${i}-b`" tag="div" class="tc-body" :hidden="!open[i]" :html="text(it)" />
    </li>
  </ul>
</template>
