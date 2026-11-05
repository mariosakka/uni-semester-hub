<script setup>
import RichText from "../RichText.vue";

defineProps({sec: {type: Object, required: true}});
</script>

<template>
  <div class="tw"><table class="tbl">
    <thead><tr><RichText v-for="(c, i) in sec.columns" :key="i" tag="th" :html="c" /></tr></thead>
    <tbody><tr v-for="(r, i) in sec.rows" :key="i"><RichText v-for="(c, j) in r" :key="j" tag="td" :html="c" /></tr></tbody>
  </table></div>
</template>
