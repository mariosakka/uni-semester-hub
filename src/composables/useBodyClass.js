import {onScopeDispose, toValue, watchEffect} from "vue";

// Mirrors a boolean (ref/getter) onto a <body> class; removed when the owner unmounts.
export function useBodyClass(name, source) {
  watchEffect(() => document.body.classList.toggle(name, !!toValue(source)));
  onScopeDispose(() => document.body.classList.remove(name));
}
