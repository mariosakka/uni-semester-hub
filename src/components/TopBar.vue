<script setup>
import {t} from "../lib/strings.js";
// phones/tablets: sticky bar with the menu button and "Year · Semester · tab"
defineProps({open: Boolean, label: String});
defineEmits(["toggle"]);
</script>

<template>
  <div id="bar"><button id="menu" type="button" :aria-label="t(open ? 'nav.menuClose' : 'nav.menuOpen')" :aria-expanded="String(open)" aria-controls="side" @click="$emit('toggle')">&#9776;</button><b id="bar-sem">{{ label }}</b></div>
</template>
