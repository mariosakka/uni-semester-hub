<script setup>
// phones/tablets: off-canvas drawer; desktop: the same <aside> is a fixed sidebar
defineProps({
  tabs: {type: Array, required: true},
  cur: {type: String, default: ""},
  sem: {type: Object, required: true},
  q: {type: String, default: ""}
});
const emit = defineEmits(["update:q", "pick", "enter"]);
defineOptions({name: "AppSidebar"});
import {t} from "../lib/strings.js";
import {useHub} from "../composables/useHub.js";
import LogoRow from "./LogoRow.vue";
import TabNav from "./TabNav.vue";
import SemesterSelects from "./SemesterSelects.vue";
const hub = useHub();
const M = hub.N.meta;
const logos = (M.logos || []).filter(l => l.src);
const title = M.title || t("doc.title");
const onEnter = e => { e.target.blur(); emit("enter"); }; // phones: Enter closes the drawer to show the results
</script>

<template>
  <aside id="side" tabindex="-1" :aria-label="t('nav.label')">
    <div id="side-logos"><LogoRow v-if="logos.length" :logos="logos" :base="hub.base" /></div>
    <div class="brand"><b id="title">{{ title }}</b><span id="prog">{{ M.programme || M.university || "" }}</span></div>
    <input id="q" type="search" :value="q" :placeholder="t('nav.searchPlaceholder')" :aria-label="t('nav.searchLabel')" @input="emit('update:q', $event.target.value)" @keydown.enter="onEnter">
    <TabNav :tabs="tabs" :cur="cur" :sem-id="sem.id" />
    <SemesterSelects :years="hub.N.years" :sems="hub.SEMS" :auto="hub.auto" :sem="sem" @pick="emit('pick', $event)" />
  </aside>
</template>
