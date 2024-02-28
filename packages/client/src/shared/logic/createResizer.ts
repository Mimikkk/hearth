import { createDrag } from '@logic/createDrag.js';

export const createResizer = (options?: Resizer.Options): Resizer => {
  const target: { ref: HTMLDivElement } = { ref: undefined! };
  let offset: { x: number; y: number } | null = null;
  let start: { x: number; y: number } | null = null;
  let move: { x: number; y: number } | null = null;
  let size: { width: number; height: number } | null = null;
  let style: CSSStyleDeclaration | null = null!;
  let originalStyle: { width?: string; height?: string } | null = null;

  const handleStart = createDrag({
    onStart: event => {
      if (!target.ref) return;
      if (event.currentTarget !== event.target) return;
      window.getSelection()?.removeAllRanges();

      style = target.ref.style;
      start = { x: event.clientX, y: event.clientY };
      offset = { x: 0, y: 0 };
      size = {
        width: target.ref.offsetWidth,
        height: target.ref.offsetHeight,
      };

      options?.onStart?.({ event, size, offset, start, style, move: start });
    },
    onMove: event => {
      if (!start || !size || !offset || !style) return;
      move = { x: event.clientX, y: event.clientY };

      offset.x = move.x - start.x;
      const x = size.width + offset.x;
      if (options?.horizontal !== false) {
        style.width = `${x}px`;
      }
      offset.y = move.y - start.y;
      const y = size.height + offset.y;
      if (options?.vertical !== false) {
        style.height = `${y}px`;
      }

      options?.onMove?.({ event, size, offset, start, move, style });
    },
    onEnd: event => {
      if (!start || !size || !offset || !style || !move) return;
      options?.onEnd?.({ event, size, offset, start, move, style });

      const s = style;
      const os = originalStyle;

      originalStyle = null;
      offset = null;
      style = null;
      start = null;
      move = null;
      size = null;

      if (!s || !os || event.defaultPrevented) return;
      s.removeProperty('width');
      s.removeProperty('height');
    },
  });

  const handleReset = () => {
    if (!target.ref || !options) return;
    if (options.horizontal !== false) target.ref.style.removeProperty('width');
    if (options.vertical !== false) target.ref.style.removeProperty('height');
    options.onReset?.();
  };

  return { target, start: handleStart, reset: handleReset };
};

export interface Resizer {
  target: { ref: HTMLDivElement };
  start: (event: PointerEvent) => void;
  reset: () => void;
}

export namespace Resizer {
  export const create = createResizer;

  export interface Context {
    event: PointerEvent;
    size: { width: number; height: number };
    offset: { x: number; y: number };
    start: { x: number; y: number };
    move: { x: number; y: number };
    style: CSSStyleDeclaration;
  }

  export type Handler = (context: Context) => void;

  export interface Options {
    onReset?: () => void;
    onStart?: Handler;
    onMove?: Handler;
    onEnd?: Handler;
    vertical?: boolean;
    horizontal?: boolean;
  }
}
