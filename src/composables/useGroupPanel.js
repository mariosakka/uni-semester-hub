import {ref, reactive, computed, nextTick, onMounted, onBeforeUnmount} from "vue";

// Open state of the subgroup disclosure, kept per semester id so it survives tab switches. Escape closes it (focus back to the
// button), a click outside .gwrap closes it. Returns the template refs btn / panel to bind.
const openBy = reactive({});

export function useGroupPanel(getD) {
  const btn = ref(null), panel = ref(null);
  const open = computed({get: () => !!openBy[getD().id], set: v => { openBy[getD().id] = v; }});
  function close(refocus) { if (!open.value) return; open.value = false; if (refocus && btn.value) btn.value.focus(); }
  function toggle() {
    open.value = !open.value;
    if (open.value) nextTick(() => { const s = panel.value && panel.value.querySelector("select"); if (s) s.focus(); });
  }
  const onKey = e => { if (e.key === "Escape") close(true); };
  const onClick = e => { if (!e.target.closest(".gwrap")) close(false); };
  onMounted(() => { document.addEventListener("keydown", onKey); document.addEventListener("click", onClick); });
  onBeforeUnmount(() => { document.removeEventListener("keydown", onKey); document.removeEventListener("click", onClick); });
  return {open, btn, panel, close, toggle};
}
