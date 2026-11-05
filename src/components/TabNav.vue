<script setup>
import {t} from "../lib/strings.js";
import {tabIcon} from "../lib/tabs.js";
// sidebar nav: links point at #<semesterId>/<tab>; titles are trusted HTML from the data author
defineProps({tabs: Array, cur: String, semId: String});
</script>

<template>
  <nav id="tabs" :aria-label="t('nav.sections')">
    <a v-for="tab in tabs" :key="tab.id" :href="'#' + semId + '/' + tab.id" :class="{on: tab.id === cur}" :aria-current="tab.id === cur ? 'page' : null"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="tabIcon(tab.id)"/></svg><span v-html="tab.title"></span></a>
  </nav>
</template>
