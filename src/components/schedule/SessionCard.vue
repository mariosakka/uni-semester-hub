<script setup>
import {computed} from "vue";
import {t} from "../../lib/strings.js";
import {fmtTime} from "../../lib/util.js";
import {courseOf, typeName, typeLetter, cardAria, sessionKey} from "../../lib/schedule.js";

// One session: a positioned block in the week grid (kind "ev") or a card in the phone agenda (kind "acard").
// It is a control: click, Enter or Space asks the parent to open the session modal.
const props = defineProps({
  s: {type: Object, required: true},
  semester: {type: Object, required: true},
  kind: {type: String, required: true},
  lane: {type: Array, default: () => [0, 1]}, // [lane, lane count]
  h0: {type: Number, default: 0} // first hour of the grid
});
const emit = defineEmits(["open"]);

const ev = computed(() => props.kind === "ev");
const narrow = computed(() => ev.value && props.lane[1] > 1); // narrow lane: the full note is in the modal
const cls = computed(() => {
  const s = props.s;
  return [props.kind, "c-" + (courseOf(props.semester, s.course).color || "grey"), s.status === "cancel" && "cx", s.status === "dev" && "dev", ev.value && props.lane[1] > 2 && "dense"];
});
const style = computed(() => {
  const {s, lane: [l, n], h0} = props;
  return (n > 1 ? `left:${100 * l / n}%;right:${100 * (n - l - 1) / n}%;font-size:.72rem;` : "") +
    `top:calc(var(--rh) * ${s.start - h0});height:calc(var(--rh) * ${s.end - s.start} - 4px)`;
});
const sub = computed(() => [props.s.teacher, props.s.status === "cancel" ? t("schedule.notHeld") : ""].filter(Boolean).join(" · "));
const mark = computed(() => props.s.status === "cancel" ? "✕" : "⚠");
function onKey(e) { if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) { e.preventDefault(); emit("open", props.s, e.currentTarget); } }
</script>

<template>
  <div
    :class="cls" role="button" tabindex="0" aria-haspopup="dialog" :aria-label="cardAria(semester, s)" :data-sk="sessionKey(s)"
       :title="ev ? fmtTime(s.start) + '–' + fmtTime(s.end) + ' ' + s.title + (s.note ? ' – ' + s.note : '') : null" :data-dur="ev ? s.end - s.start : null" :style="ev ? style : null"
       @click="emit('open', s, $event.currentTarget)"
       @keydown="onKey">
    <b>{{ fmtTime(s.start) }}–{{ fmtTime(s.end) }}</b> <span class="t">{{ s.name }}</span>
    <span class="lbs">
      <span class="lb lt" :title="typeName(s.type)">{{ typeLetter(s.type) }}</span>
      <span v-if="s.group" class="lb">{{ t('schedule.subgroup', {n: s.group}) }}</span>
      <template v-if="s.status !== 'cancel'">
        <span v-if="s.mode === 'online'" class="lb lo lx">{{ t('schedule.online') }}</span>
        <span v-else-if="s.room" class="lb lx">{{ s.room }}</span>
      </template>
    </span>
    <small v-if="!(s.status === 'cancel' && s.note) && (s.teacher || s.status === 'cancel')">{{ sub }}</small>
    <template v-if="s.note">
      <span v-if="narrow" class="badge" :title="s.note">{{ mark }}{{ s.u ? " ?" : "" }}</span>
      <span v-else class="badge">{{ mark }} {{ s.note }}{{ s.u ? " ?" : "" }}</span>
    </template>
  </div>
</template>
