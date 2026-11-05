import {onBeforeUnmount, onMounted, ref} from "vue";
import {useBodyClass} from "./useBodyClass.js";

// phones/tablets: the sidebar (#side) is an off-canvas drawer opened by #menu (CSS); on desktop none of this is visible.
export function useDrawer() {
  const navOpen = ref(false);
  useBodyClass("nav-open", navOpen);
  const setNav = (open, refocus) => {
    navOpen.value = open;
    if (open) document.getElementById("side").focus(); else if (refocus) document.getElementById("menu").focus();
  };
  const onKey = e => { if (e.key === "Escape" && navOpen.value) setNav(false, true); };
  const onSideClick = e => { if (e.target.closest("a")) setNav(false); };
  onMounted(() => addEventListener("keydown", onKey));
  onBeforeUnmount(() => removeEventListener("keydown", onKey));
  return {navOpen, setNav, onSideClick};
}
