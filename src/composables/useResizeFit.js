import {onMounted, onBeforeUnmount, onUpdated} from "vue";

// Calls fit() on mount, after every update, when fonts finish loading and when the element's width changes.
// fit() must cope with the element being hidden (clientWidth 0).
export function useResizeFit(elRef, fit) {
  let ro = null, gone = false;
  onMounted(() => {
    let lastW = -1;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(() => { const w = elRef.value.clientWidth; if (w !== lastW) { lastW = w; fit(); } });
      ro.observe(elRef.value);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!gone && elRef.value) fit(); });
    fit();
  });
  onUpdated(fit);
  onBeforeUnmount(() => { gone = true; if (ro) ro.disconnect(); });
}
