import {reactive} from "vue";

// Open/closed state of the to-do cards of one list. Done cards start closed, `open: true` starts a card open.
export function useTodoCard(items, isDone) {
  const hasText = it => typeof it === "object" && it !== null && !!it.text;
  const open = reactive(items.map((it, i) => hasText(it) && it.open === true && !isDone(it, i)));
  return {open, toggle: i => { open[i] = !open[i]; }, close: i => { open[i] = false; }};
}
