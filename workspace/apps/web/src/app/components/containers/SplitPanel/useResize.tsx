import { clamp } from "@mimi/hearth-math";
import { createEffect, createSignal, onCleanup } from "solid-js";
import type { ResizeDirection } from "./types.tsx";

export interface UseResizeOptions {
  value?: number | null;
  onResize?: (value: number | null) => void;
  direction?: ResizeDirection;
}

export const useResize = (options: UseResizeOptions) => {
  const [containerRef, setContainerRef] = createSignal<HTMLElement>();
  const [draggableRef, setDraggableRef] = createSignal<HTMLElement>();

  const isHorizontal = options.direction === "horizontal";
  const cursor = isHorizontal ? "cursor-col-resize" : "cursor-row-resize";
  const dimKey = isHorizontal ? "width" : "height";
  const minKey = isHorizontal ? "minWidth" : "minHeight";
  const maxKey = isHorizontal ? "maxWidth" : "maxHeight";
  const offsetKey = isHorizontal ? "offsetWidth" : "offsetHeight";
  const clientKey = isHorizontal ? "clientWidth" : "clientHeight";
  const positionKey = isHorizontal ? "clientX" : "clientY";

  let startPosition = 0;
  let startSize = 0;

  const updateSize = (value: number | null | undefined) => {
    const container = containerRef();
    if (!container) return;

    if (value === null || value === undefined) {
      container.style[dimKey] = "inherit";
      options.onResize?.(null);
      return;
    }

    const child = container.firstElementChild as HTMLElement | undefined;
    if (!child) return;

    const computedStyle = globalThis.getComputedStyle(child);
    const min = parseFloat(computedStyle[minKey]) || 0;
    const max = parseFloat(computedStyle[maxKey]) || Infinity;

    const parentElement = container.parentElement;
    if (!parentElement) return;

    const maxAllowed = parentElement[clientKey];
    const clampedValue = clamp(value, min, Math.min(max, maxAllowed));
    child.style[dimKey] = `${clampedValue}px`;
    options.onResize?.(clampedValue);
  };

  const handleRemoval = () => {
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
    document.removeEventListener("pointercancel", onPointerUp);

    const classes = document.body.classList;
    classes.remove(cursor);
    if (classes.length === 0) document.body.removeAttribute("class");

    const dragBar = draggableRef();
    if (dragBar) {
      const childClasses = dragBar.classList;
      childClasses.remove("bg-gray-500/50");
      if (childClasses.length === 0) dragBar.removeAttribute("class");
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    updateSize(startSize + event[positionKey] - startPosition);
  };

  const onPointerUp = () => {
    handleRemoval();
  };

  const onPointerDown = (event: PointerEvent) => {
    const element = containerRef();
    const dragBar = draggableRef();
    if (!element || !dragBar) return;

    dragBar.setPointerCapture(event.pointerId);

    startPosition = event[positionKey];
    startSize = element[offsetKey];
    dragBar.classList.add("bg-gray-500/50");
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerUp);
    document.body.classList.add(cursor);
  };

  const restart = () => {
    const element = containerRef();
    if (!element) return;
    const child = element.firstElementChild as HTMLElement | undefined;

    if (child) child.style[dimKey] = "inherit";
    options.onResize?.(element[offsetKey]);
  };

  createEffect(() => updateSize(options.value));
  onCleanup(handleRemoval);

  return { setContainerRef, setDraggableRef, onPointerDown, restart };
};
