import {inject} from "vue";
import {HubKey} from "../injection.js";

// The app-wide object App.vue provides: {set, base, N, SEMS, auto, store(scope), viewOf(sem)}.
export function useHub() {
  const hub = inject(HubKey);
  if (!hub) throw new Error("useHub(): no hub provided (is the component mounted under App.vue?)");
  return hub;
}
