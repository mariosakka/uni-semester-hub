import {reactive} from "vue";

// Open/closed state of the to-do cards of one list. `open: true` starts a card open.
export function useTodoCard(items) {
  const hasText = it => typeof it === "object" && it !== null && !!it.text;
  const open = reactive(items.map(it => hasText(it) && it.open === true));
  return {open, toggle: i => { open[i] = !open[i]; }};
}
