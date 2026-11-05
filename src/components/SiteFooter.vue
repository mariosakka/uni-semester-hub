<script setup>
import {computed} from "vue";
import {t} from "../lib/strings.js";
import LogoRow from "./LogoRow.vue";
import "../styles/footer.css";
// footer from meta: programme column (logos, programme line, author), project column (version + repository button), disclaimer; nothing for absent keys
const props = defineProps({meta: {type: Object, required: true}, base: {type: String, default: ""}});
const web = u => /^https?:\/\//.test(u || "");
const logos = computed(() => (props.meta.logos || []).filter(l => l.src));
const line = computed(() => props.meta.programmeLine || props.meta.programme);
const version = typeof __APP_VERSION__ === "undefined" ? "" : __APP_VERSION__; // injected by vite.config.js
const repo = typeof __REPO_URL__ === "undefined" ? "" : __REPO_URL__;
const made = computed(() => { const [before, after = ""] = t("footer.madeBy", {name: "\u0001"}).split("\u0001"); return {before, after}; }); // the name sits where the text puts {name}
const hasAbout = computed(() => logos.value.length || line.value || (props.meta.author && props.meta.author.name));
// the GitHub mark (Octicons "mark-github", MIT)
const GH = "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z";
</script>

<template>
  <footer id="foot">
    <div class="fcols">
      <div v-if="hasAbout" class="fcol">
        <LogoRow v-if="logos.length" :logos="logos" :base="base" />
        <p v-if="line">{{ line }}</p>
        <p v-if="meta.author && meta.author.name">{{ made.before }}<a v-if="web(meta.author.url)" :href="meta.author.url">{{ meta.author.name }}</a><template v-else>{{ meta.author.name }}</template>{{ made.after }}</p>
      </div>
      <div v-if="version || repo" class="fcol">
        <h2 v-if="version">{{ t('footer.version', {version}) }}</h2>
        <div class="fbtns">
          <a v-if="repo" class="fbtn" :href="repo"><svg viewBox="0 0 16 16" aria-hidden="true"><path :d="GH" /></svg>{{ t('footer.source') }}</a>
          <a v-if="repo && version" class="fbtn" :href="repo + '/releases/tag/v' + version">{{ t('footer.releaseNotes') }}</a>
        </div>
      </div>
    </div>
    <p v-if="meta.disclaimer" class="dis fdis">{{ meta.disclaimer }}</p>
  </footer>
</template>
