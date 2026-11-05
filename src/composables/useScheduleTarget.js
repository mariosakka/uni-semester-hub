import {reactive} from "vue";

// "Open in Schedule": the calendar/day popup requests {sem, w}; ScheduleView consumes it and clears w.
const target = reactive({sem: null, w: null});

export function useScheduleTarget() {
  return {target, request: (sem, w) => Object.assign(target, {sem, w}), clear: () => { target.w = null; }};
}
