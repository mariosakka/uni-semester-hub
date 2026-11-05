import {reactive, computed} from "vue";
import {timeline, currentIndex} from "../lib/schedule.js";

// The shown Schedule week per semester id: survives tab and semester switches (until reload). getD() gives the semester view.
const chosen = reactive({});

export function useWeekSelection(getD) {
  const T = computed(() => timeline(getD()));
  const i = computed(() => {
    const saved = chosen[getD().id];
    return Math.min(Math.max(saved === undefined ? currentIndex(T.value) : saved, 0), T.value.length - 1);
  });
  return {T, i, go: k => { chosen[getD().id] = k; }};
}
