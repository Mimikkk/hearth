import cx from "clsx";
import type { JSXElement } from "solid-js";
import { ResizeControl } from "./ResizeControl.tsx";
import type { ResizeDirection } from "./types.tsx";
import { useResize } from "./useResize.tsx";

export interface SplitPanelProps {
  first: JSXElement;
  second: JSXElement;
  direction: ResizeDirection;
  class?: string;
  value?: number | null;
  onResize?: (value: number | null) => void;
}

export const SplitPanel = (props: SplitPanelProps) => {
  const { setContainerRef, setDraggableRef, onPointerDown, restart } = useResize(props);

  return (
    <div
      class={cx("overflow-hidden", props.direction === "vertical" ? "flex flex-col" : "flex", props.class)}
      role="group"
      aria-label="Resizable split view"
    >
      <span class="relative" ref={setContainerRef}>
        {props.first}
        <ResizeControl
          direction={props.direction}
          onStart={onPointerDown}
          onReset={restart}
          class="hover:bg-gray-500/50"
          ref={setDraggableRef}
        />
      </span>
      {props.second}
    </div>
  );
};
