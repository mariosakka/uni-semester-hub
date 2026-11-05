import {reactive} from "vue";

// The one open modal, rendered by <ModalHost/>. kind "day": {D, key}; kind "session": {D, sess, key}. opener = element to refocus on close.
const modal = reactive({kind: null, D: null, key: "", sess: null, opener: null});

export function useModal() {
  const openDayModal = (D, key, opener) => Object.assign(modal, {kind: "day", D, key, sess: null, opener: opener || null});
  const openSessionModal = (D, sess, opener) => Object.assign(modal, {kind: "session", D, sess, key: sess.key, opener: opener || null});
  const closeModal = () => { const o = modal.opener; Object.assign(modal, {kind: null, D: null, sess: null, opener: null}); if (o && o.focus) o.focus(); };
  return {modal, openDayModal, openSessionModal, closeModal};
}
