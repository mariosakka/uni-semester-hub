import {onBeforeUnmount, onMounted, ref} from "vue";

// Tracks location.hash. canonical() returns the hash that should be shown; any other non-empty hash is rewritten to it
// (a tab the semester lacks, or an old #overview/#y2s1 link). onRoute runs after every hash change.
export function useHashRoute(canonical, onRoute) {
  const hash = ref(location.hash);
  function route() {
    hash.value = location.hash;
    const canon = canonical();
    if (location.hash && location.hash !== canon) history.replaceState(null, "", canon);
    onRoute();
  }
  onMounted(() => { addEventListener("hashchange", route); route(); });
  onBeforeUnmount(() => removeEventListener("hashchange", route));
  return hash;
}
