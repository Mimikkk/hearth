import cx from "clsx";
import type { Ref } from "solid-js";
import type { ResizeDirection } from "./types.tsx";

export interface ResizeControlProps {
  ref: Ref<HTMLDivElement>;
  onStart: (event: PointerEvent) => void;
  onReset: () => void;
  direction: ResizeDirection;
  class?: string;
}

export const ResizeControl = (props: ResizeControlProps) => (
  <div
    ref={props.ref}
    class={cx(
      "absolute touch-none",
      props.direction === "horizontal"
        ? "cursor-col-resize h-full -right-1.5 top-0 w-3"
        : "cursor-row-resize w-full -bottom-1.5 left-0 h-3",
      props.class,
    )}
    onPointerDown={props.onStart}
    onDblClick={props.onReset}
    role="separator"
    aria-label="Resize control"
  />
);
