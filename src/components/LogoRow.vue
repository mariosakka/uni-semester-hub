<script setup>
// meta.logos as a row of linked logos, each with an optional background badge (for logos with white artwork)
defineProps({logos: {type: Array, required: true}, base: {type: String, default: ""}});
const web = u => /^https?:\/\//.test(u || ""); // only http(s) links from data
</script>

<template>
  <div class="logos">
    <component :is="web(l.url) ? 'a' : 'span'" v-for="l in logos" :key="l.src" class="logo" :href="web(l.url) ? l.url : null" :style="l.bg ? {background: l.bg} : null"><img :src="base + l.src" :alt="l.alt || ''"></component>
  </div>
</template>
