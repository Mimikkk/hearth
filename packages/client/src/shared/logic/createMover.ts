import { createDrag } from '@logic/createDrag.js';

export const createMover = (options?: Mover.Options): Mover => {
  const target: { ref: HTMLDivElement } = { ref: undefined! };
  let start: { x: number; y: number } | null = null;
  let move: { x: number; y: number } | null = null;
  let offset: { x: number; y: number } | null = null;
  let style: CSSStyleDeclaration | null = null!;

  const handleStart = createDrag({
    onStart: event => {
      if (!target.ref) return;

      style = window.getComputedStyle(target.ref);
      const matrix = new DOMMatrixReadOnly(style.transform);

      start = { x: event.clientX - matrix.m41, y: event.clientY - matrix.m42 };
      offset = { x: 0, y: 0 };
      move = { x: 0, y: 0 };

      options?.onStart?.({ event, start, move, offset, style });
    },
    onMove: event => {
      if (!start || !offset || !move || !style) return;
      move.x = event.clientX;
      move.y = event.clientY;

      const within = options?.within ?? document.documentElement;
      const left = within.offsetLeft - target.ref.offsetLeft;
      const top = within.offsetTop - target.ref.offsetTop;
      const right = within.offsetWidth - target.ref.offsetWidth - target.ref.offsetLeft;
      const bottom = within.offsetHeight - target.ref.offsetHeight - target.ref.offsetTop;

      offset.x = Math.max(left, Math.min(move.x - start.x, right));
      offset.y = Math.max(top, Math.min(move.y - start.y, bottom));

      target.ref.style.transform = `translate(${offset.x}px, ${offset.y}px)`;

      options?.onMove?.({ event, start, move, offset, style });
    },
    onEnd: event => {
      if (!start || !move || !offset || !style) return;

      options?.onEnd?.({ event, start, move, offset, style });
    },
  });

  const handleReset = () => {
    options?.onReset?.();

    target.ref.style.removeProperty('transform');
  };

  return { target, start: handleStart, reset: handleReset };
};

export interface Mover {
  target: { ref: HTMLDivElement };
  start: (event: PointerEvent) => void;
  reset: () => void;
}

export namespace Mover {
  export const create = createMover;

  export interface Context {
    event: PointerEvent;
    start: { x: number; y: number } | null;
    move: { x: number; y: number } | null;
    offset: { x: number; y: number } | null;
    style: CSSStyleDeclaration;
  }

  export type Handler = (context: Context) => void;

  export interface Options {
    onReset?: () => void;
    onStart?: Handler;
    onMove?: Handler;
    onEnd?: Handler;
    within?: HTMLElement;
  }
}
