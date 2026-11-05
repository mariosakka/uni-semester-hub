// Tiny reactive state shared by features that must not import each other's components.
import {reactive, ref} from "vue";

// bumped whenever a subgroup choice changes: anything that lists sessions (schedule, calendar, day modal) reads it inside render/computed
export const groupTick = ref(0);

// "Open in Schedule": the calendar/day modal sets {sem, w}, navigates to #<sem>/schedule; ScheduleView consumes it (sets w back to null)
export const scheduleTarget = reactive({sem: null, w: null});

// the one open modal (rendered by <ModalHost/> in App.vue, owned by the calendar feature)
// kind "day": {D, key}   kind "session": {D, sess}   opener = element to refocus on close
export const modal = reactive({kind: null, D: null, key: "", sess: null, opener: null});
export const openDayModal = (D, key, opener) => Object.assign(modal, {kind: "day", D, key, sess: null, opener: opener || null});
export const openSessionModal = (D, sess, opener) => Object.assign(modal, {kind: "session", D, sess, key: sess.key, opener: opener || null});
export const closeModal = () => { const o = modal.opener; Object.assign(modal, {kind: null, D: null, sess: null, opener: null}); if (o && o.focus) o.focus(); };
