import {ref} from "vue";

// Subgroup choices live in plain objects (src/lib/groups.js). Whoever changes one calls bump(); anything that lists sessions reads
// tick.value inside a computed/render so it re-renders.
const tick = ref(0);

export function useSubgroupSync() {
  return {tick, bump: () => { tick.value++; }};
}
