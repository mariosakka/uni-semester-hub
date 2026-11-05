<script setup>
defineProps({sec: Object});
</script>

<template>
  <div class="tw"><table class="tbl">
    <thead><tr><th v-for="(c, i) in sec.columns" :key="i" v-html="c"></th></tr></thead>
    <tbody><tr v-for="(r, i) in sec.rows" :key="i"><td v-for="(c, j) in r" :key="j" v-html="c"></td></tr></tbody>
  </table></div>
</template>
