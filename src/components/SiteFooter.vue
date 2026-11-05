<script setup>
import {computed} from "vue";
import {t} from "../lib/strings.js";
import LogoRow from "./LogoRow.vue";
// footer from meta: logos, programme line, author, disclaimer; nothing for absent keys
const props = defineProps({M: Object, base: String});
const web = u => /^https?:\/\//.test(u || "");
const logos = computed(() => (props.M.logos || []).filter(l => l.src));
const line = computed(() => props.M.programmeLine || props.M.programme);
const version = typeof __APP_VERSION__ === "undefined" ? "" : __APP_VERSION__; // injected by vite.config.js
const repo = typeof __REPO_URL__ === "undefined" ? "" : __REPO_URL__;
const made = computed(() => { const [before, after = ""] = t("footer.madeBy", {name: "\u0001"}).split("\u0001"); return {before, after}; }); // the name sits where the text puts {name}
</script>

<template>
  <footer id="foot">
    <LogoRow v-if="logos.length" :logos="logos" :base="base"/>
    <p v-if="line">{{ line }}</p>
    <p v-if="M.author && M.author.name">{{ made.before }}<a v-if="web(M.author.url)" :href="M.author.url">{{ M.author.name }}</a><template v-else>{{ M.author.name }}</template>{{ made.after }}</p>
    <p v-if="version || repo" class="ver"><a v-if="version && repo" :href="repo + '/releases/tag/v' + version">{{ t('footer.version', {version}) }}</a><template v-else-if="version">{{ t('footer.version', {version}) }}</template><template v-if="version && repo"> · </template><a v-if="repo" :href="repo">{{ t('footer.source') }}</a></p>
    <p v-if="M.disclaimer" class="dis">{{ M.disclaimer }}</p>
  </footer>
</template>
