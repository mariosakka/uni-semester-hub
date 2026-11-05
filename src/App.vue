<script setup>
import {computed, provide} from "vue";
import {t} from "./lib/strings.js";
import {esc} from "./lib/util.js";
import {parseRoute} from "./lib/semester.js";
import {tabsFor, tabOf} from "./lib/tabs.js";
import {HubKey} from "./injection.js";
import {useBodyClass} from "./composables/useBodyClass.js";
import {useDrawer} from "./composables/useDrawer.js";
import {useHashRoute} from "./composables/useHashRoute.js";
import {useSearchFilter} from "./composables/useSearchFilter.js";
import TopBar from "./components/TopBar.vue";
import Sidebar from "./components/Sidebar.vue";
import SiteFooter from "./components/SiteFooter.vue";
import RichText from "./components/RichText.vue";
import SectionView from "./components/SectionView.vue";
import ModalHost from "./components/calendar/ModalHost.vue";

const props = defineProps({hub: {type: Object, required: true}});
const hub = props.hub;
provide(HubKey, hub);

// the getters below are only called after setup (mount / hash change), so cur and sem may be declared later
const {q, searching} = useSearchFilter(() => cur.value);
const {navOpen, setNav, onSideClick} = useDrawer();
const hash = useHashRoute(() => `#${sem.value.id}/${cur.value || ""}`, () => { if (!searching.value) window.scrollTo(0, 0); });
const r = computed(() => parseRoute(hash.value, hub.SEMS, hub.auto));
const sem = computed(() => r.value.sem);
const D = computed(() => hub.viewOf(sem.value));
const tabs = computed(() => tabsFor(D.value));
const cur = computed(() => {
  let c = r.value.tab;
  if (c === "overview" && !tabs.value.some(x => x.id === "overview")) c = "news"; // old links
  return tabs.value.some(x => x.id === c) ? c : (tabs.value[0] || {}).id;
});
const curTab = computed(() => tabs.value.find(x => x.id === cur.value));
// searching shows matches from every tab; otherwise only the current tab's sections are rendered
const sections = computed(() => D.value.sections.filter(s => searching.value || tabOf(D.value, s) === cur.value));
const ptitle = computed(() => searching.value ? esc(t("nav.searchResults")) : curTab.value ? curTab.value.title : "");
const barLabel = computed(() => {
  if (searching.value) return t("nav.searchResults");
  const y = hub.N.years.length > 1 ? (hub.N.years.find(x => x.id === sem.value.yearId) || {}).title : "";
  return [y, sem.value.title, curTab.value && curTab.value.title].filter(Boolean).join(" · ");
});
useBodyClass("tabbed", () => tabs.value.length > 0);

const pick = id => { location.hash = `#${id}/${cur.value || ""}`; setNav(false); }; // a tab the new semester lacks falls back to its first tab
</script>

<template>
  <TopBar :open="navOpen" :label="barLabel" @toggle="setNav(!navOpen, true)" />
  <Sidebar v-model:q="q" :tabs="tabs" :cur="cur" :sem="sem" @pick="pick" @enter="setNav(false)" @click="onSideClick" />
  <div id="scrim" @click="setNav(false, true)"></div>
  <div id="content">
    <header class="page"><RichText id="ptitle" tag="h1" :html="ptitle" /></header>
    <main id="app"><SectionView v-for="sec in sections" :key="sem.id + ':' + sec._scope + ':' + sec._i" :sec="sec" :semester="D" /></main>
    <SiteFooter :meta="hub.N.meta" :base="hub.base" />
  </div>
  <ModalHost />
</template>
