import { createListener } from '@logic/createListener.js';
import { createSignal } from 'solid-js';

export type DragHandler = (event: PointerEvent) => void;

export interface DragOptions {
  onStart?: DragHandler;
  onMove?: DragHandler;
  onEnd?: DragHandler;
}

export const [dragPointerIds, setDragPointerIds] = createSignal(new Set<number>());

export const createDrag = (options?: DragOptions): DragHandler => {
  let clearMove: () => void;
  let clearUp: () => void;

  const handleStart: DragHandler = event => {
    options?.onStart?.(event);
    if (event.defaultPrevented) return;

    setDragPointerIds(pointer => {
      pointer.add(event.pointerId);

      return new Set(pointer);
    });

    event.stopPropagation();
  };
  const handleMove: DragHandler = event => {
    options?.onMove?.(event);
    event.preventDefault();
    event.stopPropagation();
  };
  const handleEnd: DragHandler = event => {
    options?.onEnd?.(event);
    event.preventDefault();
    event.stopPropagation();

    setDragPointerIds(pointers => {
      pointers.delete(event.pointerId);

      return new Set(pointers);
    });

    clearMove();
    clearUp();
  };

  return (event: PointerEvent) => {
    handleStart(event);
    if (event.defaultPrevented) return;

    clearMove = createListener('pointermove', handleMove, false);
    clearUp = createListener('pointerup', handleEnd, false);
  };
};
