import {reactive} from "vue";
import {useHub} from "./useHub.js";

// Ticked to-do items of one scope ("common" or a semester id): a reactive Set of `${section id}:${item index}` ids, persisted through hub.store.
export function useTicks(scope) {
  const st = useHub().store(scope), done = reactive(st.done);
  const toggle = (id, checked) => { if (checked) done.add(id); else done.delete(id); st.save(); };
  return {done, toggle};
}
