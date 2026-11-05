<script setup>
// meta.logos as a row of linked logos, each with an optional background badge (for logos with white artwork)
defineProps({logos: Array, base: String});
const web = u => /^https?:\/\//.test(u || ""); // only http(s) links from data
</script>

<template>
  <div class="logos">
    <component :is="web(l.url) ? 'a' : 'span'" v-for="(l, i) in logos" :key="i" class="logo" :href="web(l.url) ? l.url : null" :style="l.bg ? {background: l.bg} : null"><img :src="base + l.src" :alt="l.alt || ''"></component>
  </div>
</template>
