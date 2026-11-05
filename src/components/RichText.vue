<script setup>
// The single place trusted data HTML is rendered (data strings may contain markup by design, see docs/SCHEMA.md).
defineProps({
  html: {type: String, default: ""},
  tag: {type: String, default: "span"}
});
</script>

<template>
  <component :is="tag" v-html="html" />
</template>
