import { createMemo, createSignal } from 'solid-js';
import { createDrag } from '@logic/createDrag.js';

const clamp = (min: number, max: number, value: number) => Math.max(min, Math.min(max, value));

export interface DragOptions {
  onDown?: (event: PointerEvent) => void;
  onMove?: (event: PointerEvent) => void;
  onUp?: (event: PointerEvent) => void;
  within?: HTMLElement;
}

export const createResizeV1 = (options?: DragOptions) => {
  type Position = { x: number; y: number };
  const [startPosition, setStartPosition] = createSignal<Position | null>(null);
  const [movePosition, setMovePosition] = createSignal<Position | null>(null);
  const [selected, select] = createSignal<HTMLElement | null>(null);
  const style = createMemo(() => {
    const s = selected();

    return s ? getComputedStyle(s) : null;
  });
  const [offset, setOffset] = createSignal<Position | null>(null);
  const position = createMemo(() => {
    const p = movePosition();
    const s = selected();
    const o = offset();
    if (!p || !s || !o) return;

    const { left, top } = style()!;
    const tx = parseInt(left === 'auto' ? '0' : left);
    const ty = parseInt(top === 'auto' ? '0' : top);

    const within = options?.within || document.documentElement;
    const x = clamp(-tx, within.offsetWidth - tx - s.offsetWidth, p.x - o.x);
    const y = clamp(-ty, within.offsetHeight - ty - s.offsetHeight, p.y - o.y);
    return { x, y };
  });

  const onDown = createDrag({
    onStart: event => {
      if (event.currentTarget !== event.target) return;
      options?.onDown?.(event);
      if (event.defaultPrevented) return;

      const element = event.currentTarget as HTMLElement;
      const sp = { x: event.clientX, y: event.clientY };
      const { borderLeftWidth: ox, borderTopWidth: oy, left, top } = getComputedStyle(element);
      const tx = parseInt(left === 'auto' ? '0' : left);
      const ty = parseInt(top === 'auto' ? '0' : top);

      select(element);
      setStartPosition(sp);
      setOffset({ x: event.offsetX + parseInt(ox) + tx, y: event.offsetY + parseInt(oy) + ty });
    },
    onMove: event => {
      options?.onMove?.(event);

      setStartPosition(null);
      setMovePosition(null);
      setOffset(null);
      select(null);
    },
    onEnd: event => {
      options?.onMove?.(event);

      setMovePosition({ x: event.clientX, y: event.clientY });
    },
  });

  return { selected, select, onDown, position, startPosition, movePosition, offset };
};
