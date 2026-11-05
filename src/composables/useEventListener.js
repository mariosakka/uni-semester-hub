import {onMounted, onBeforeUnmount} from "vue";

// Adds a listener to `target` (window, document, element) while the component is mounted.
export function useEventListener(target, type, handler, options) {
  onMounted(() => target.addEventListener(type, handler, options));
  onBeforeUnmount(() => target.removeEventListener(type, handler, options));
}
