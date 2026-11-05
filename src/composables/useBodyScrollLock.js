import {watch, onScopeDispose} from "vue";

// iOS Safari ignores overflow:hidden on <body> for scrolling, so while `active` is true the page is pinned with position:fixed
// (class modal-open + body.style.top) and the scroll offset is restored afterwards. unlock() is returned for callers that must
// release the lock synchronously (before returning focus to an element).
export function useBodyScrollLock(active) {
  let y = 0, locked = false;
  function lock() { if (locked) return; y = window.pageYOffset; document.body.style.top = -y + "px"; document.body.classList.add("modal-open"); locked = true; }
  function unlock() { if (!locked) return; document.body.classList.remove("modal-open"); document.body.style.top = ""; window.scrollTo(0, y); locked = false; }
  watch(active, on => on ? lock() : unlock());
  onScopeDispose(unlock);
  return {unlock};
}
