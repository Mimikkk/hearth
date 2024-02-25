import type { Ref } from "solid-js";
import { createVirtualizer } from "@tanstack/solid-virtual";

export const createRows = <T>(ref: () => Ref<T>, rows: number, height: number) => {
  const virtualizer = createVirtualizer({
    getScrollElement: ref as () => Element | null,
    estimateSize: () => height,
    overscan: 1,
    count: rows,
  });

  return Object.defineProperties(virtualizer, {
    size: { get: virtualizer.getTotalSize },
    items: { get: virtualizer.getVirtualItems },
  }) as typeof virtualizer & { get size(): number; get items(): ReturnType<typeof virtualizer.getVirtualItems> };
};
