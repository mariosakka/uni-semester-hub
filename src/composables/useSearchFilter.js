import {computed, onMounted, onUpdated, ref} from "vue";
import {useBodyClass} from "./useBodyClass.js";

// Sidebar search. Hides non-matching items; built-in schedule/calendar and pinned sections stay visible.
// Also marks the current tab's sections (.on, CSS needs it). DOM-based on purpose: items are rendered by many components.
// cur() returns the current tab id.
export function useSearchFilter(cur) {
  const q = ref("");
  const searching = computed(() => !!q.value);
  useBodyClass("searching", searching);
  function applyFilter() {
    const f = q.value.toLowerCase();
    document.querySelectorAll("#app section").forEach(s => {
      s.classList.toggle("on", s.dataset.tab === cur());
      let any = false;
      s.querySelectorAll("li, tbody:not(.prow) tr, tbody.prow").forEach(el => { // a study-plan subject is one tbody (main + detail row)
        const m = el.textContent.toLowerCase().includes(f);
        el.classList.toggle("hide", !m);
        any ||= m;
      });
      s.classList.toggle("hide", !any && !s.classList.contains("builtin") && !s.dataset.pinned);
    });
  }
  onMounted(applyFilter);
  onUpdated(applyFilter);
  return {q, searching};
}
