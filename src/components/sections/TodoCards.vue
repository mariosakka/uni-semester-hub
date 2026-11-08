<script setup>
import {t} from "../../lib/strings.js";
import {itemTitle} from "../../lib/render.js";
import {useTodoCard} from "../../composables/useTodoCard.js";
import RichText from "../RichText.vue";

const props = defineProps({
  sec: {type: Object, required: true},
  id: {type: [String, Number], required: true}
});
const items = props.sec.items || [], base = `tc${props.sec._scope || ""}-${props.id}`.replace(/[^\w-]/g, "_");
const obj = it => typeof it === "object" && it !== null;
const text = it => obj(it) && it.text ? it.text : "";
// closed cards keep their text in the DOM (hidden) so the filter still matches it
const {open, toggle} = useTodoCard(items);
const onTitle = (i, e) => { if (text(items[i]) && !e.target.closest("a")) toggle(i); };
const plain = it => itemTitle(it).replace(/<[^>]*>/g, "").trim();
</script>

<template>
  <ul class="tcards">
    <li v-for="(it, i) in items" :key="i" :class="['tcard', {hasbody: text(it), open: open[i]}]">
      <div class="tc-head">
        <span class="tc-ico" aria-hidden="true"></span>
        <span :id="`${base}-${i}-t`" class="tc-title" @click="onTitle(i, $event)"><RichText :html="itemTitle(it)" /><template v-if="obj(it) && it.due"> <span class="tc-due">{{ it.due }}</span></template></span>
        <button
v-if="text(it)" type="button" class="tc-chev" :aria-expanded="String(open[i])" :aria-controls="`${base}-${i}-b`"
          :aria-label="t('todo.details', {title: plain(it)})" @click="toggle(i)"></button>
      </div>
      <RichText v-if="text(it)" :id="`${base}-${i}-b`" tag="div" class="tc-body" :hidden="!open[i]" :html="text(it)" />
    </li>
  </ul>
</template>
