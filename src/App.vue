<script setup>
import {computed, onBeforeUnmount, onMounted, onUpdated, provide, ref, watchEffect} from "vue";
import {t} from "./lib/strings.js";
import {esc} from "./lib/util.js";
import {parseRoute} from "./lib/semester.js";
import {tabsFor, tabOf} from "./lib/tabs.js";
import TopBar from "./components/TopBar.vue";
import Sidebar from "./components/Sidebar.vue";
import SiteFooter from "./components/SiteFooter.vue";
import SectionView from "./components/SectionView.vue";
import ModalHost from "./components/calendar/ModalHost.vue";

const props = defineProps({hub: Object});
const hub = props.hub;
provide("hub", hub);

const hash = ref(location.hash), q = ref(""), navOpen = ref(false);
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
const searching = computed(() => !!q.value);
// searching shows matches from every tab; otherwise only the current tab's sections are rendered
const sections = computed(() => D.value.sections.filter(s => searching.value || tabOf(D.value, s) === cur.value));
const ptitle = computed(() => searching.value ? esc(t("nav.searchResults")) : curTab.value ? curTab.value.title : "");
const barLabel = computed(() => {
  if (searching.value) return t("nav.searchResults");
  const y = hub.N.years.length > 1 ? (hub.N.years.find(x => x.id === sem.value.yearId) || {}).title : "";
  return [y, sem.value.title, curTab.value && curTab.value.title].filter(Boolean).join(" · ");
});

watchEffect(() => {
  document.body.classList.toggle("tabbed", tabs.value.length > 0);
  document.body.classList.toggle("searching", searching.value);
});

// phones/tablets: the sidebar is an off-canvas drawer (CSS); on desktop these do nothing visible
const setNav = (open, refocus) => {
  navOpen.value = open;
  document.body.classList.toggle("nav-open", open);
  if (open) document.getElementById("side").focus(); else if (refocus) document.getElementById("menu").focus();
};
const onKey = e => { if (e.key === "Escape" && navOpen.value) setNav(false, true); };
const onSideClick = e => { if (e.target.closest("a")) setNav(false); };
const pick = id => { location.hash = `#${id}/${cur.value || ""}`; setNav(false); }; // a tab the new semester lacks falls back to its first tab

// hide non-matching items; built-in schedule/calendar and pinned sections stay visible. Also marks the current tab's sections (.on, CSS needs it).
function applyFilter() {
  const f = q.value.toLowerCase();
  document.querySelectorAll("#app section").forEach(s => {
    s.classList.toggle("on", s.dataset.tab === cur.value);
    let any = false;
    s.querySelectorAll("li, tbody:not(.prow) tr, tbody.prow").forEach(el => { // a study-plan subject is one tbody (main + detail row)
      const m = el.textContent.toLowerCase().includes(f);
      el.classList.toggle("hide", !m);
      any ||= m;
    });
    s.classList.toggle("hide", !any && !s.classList.contains("builtin") && !s.dataset.pinned);
  });
}
onMounted(applyFilter); onUpdated(applyFilter);

function route() {
  hash.value = location.hash;
  const canon = `#${sem.value.id}/${cur.value || ""}`; // a tab the semester lacks (or an old #overview/#y2s1 link) is rewritten to the tab actually shown
  if (location.hash && location.hash !== canon) history.replaceState(null, "", canon);
  if (!searching.value) window.scrollTo(0, 0);
}
onMounted(() => { addEventListener("hashchange", route); addEventListener("keydown", onKey); route(); });
onBeforeUnmount(() => { removeEventListener("hashchange", route); removeEventListener("keydown", onKey); });
</script>

<template>
  <TopBar :open="navOpen" :label="barLabel" @toggle="setNav(!navOpen, true)"/>
  <Sidebar v-model:q="q" :hub="hub" :tabs="tabs" :cur="cur" :sem="sem" @pick="pick" @enter="setNav(false)" @click="onSideClick"/>
  <div id="scrim" @click="setNav(false, true)"></div>
  <div id="content">
    <header class="page"><h1 id="ptitle" v-html="ptitle"></h1></header>
    <main id="app"><SectionView v-for="sec in sections" :key="sem.id + ':' + sec._scope + ':' + sec._i" :sec="sec" :D="D"/></main>
    <SiteFooter :M="hub.N.meta" :base="hub.base"/>
  </div>
  <ModalHost/>
</template>
