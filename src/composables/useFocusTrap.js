// Keeps Tab / Shift+Tab inside `container` (a ref to the dialog element). Bind the returned handler to keydown on a wrapper.
export function useFocusTrap(container) {
  return function onKeydown(e) {
    if (e.key !== "Tab" || !container.value) return;
    const f = [...container.value.querySelectorAll("button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])")].filter(x => x.offsetParent !== null || x === document.activeElement);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1], at = document.activeElement;
    if (e.shiftKey && (at === first || at === container.value)) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && at === last) { e.preventDefault(); first.focus(); }
  };
}
