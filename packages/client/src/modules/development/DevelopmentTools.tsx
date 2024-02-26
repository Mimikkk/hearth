import { ButtonIcon } from '@components/buttons/ButtonIcon/ButtonIcon.js';
import s from './DevelopmentTools.module.scss';
import { AvailableIconsTab } from '@modules/development/Tabs/AvailableIcons.tab.js';
import { Devtools } from '@modules/development/devtools.js';
import { Tabulator } from '@components/control/Tabulator/Tabulator.js';
import cx from 'clsx';
import { createEffect, createMemo, createSignal } from 'solid-js';
import { createListener } from '@logic/createListener.js';
import { createStorageSignal, createStorageStore } from '@logic/Storage/createStorageSignal.js';

const clamp = (min: number, max: number, value: number) => Math.max(min, Math.min(max, value));

interface DragOptions {
  onDown?: (event: PointerEvent) => void;
  onMove?: (event: PointerEvent) => void;
  onUp?: (event: PointerEvent) => void;
  within?: HTMLElement;
}

const createDrag = (options?: DragOptions) => {
  let clearMove: () => void;
  let clearUp: () => void;

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
    const tx = parseInt(left);
    const ty = parseInt(top);

    const within = options?.within || document.documentElement;
    const x = clamp(-tx, within.offsetWidth - tx - s.offsetWidth, p.x - o.x);
    const y = clamp(-ty, within.offsetHeight - ty - s.offsetHeight, p.y - o.y);
    return { x, y };
  });

  const handleDown = (event: PointerEvent) => {
    if (event.currentTarget !== event.target) return;
    options?.onDown?.(event);
    if (event.defaultPrevented) return;

    const element = event.currentTarget as HTMLElement;
    event.stopPropagation();

    const sp = { x: event.clientX, y: event.clientY };

    const { borderLeftWidth: ox, borderTopWidth: oy, left, top, bottom, right } = getComputedStyle(element);
    const tx = parseInt(left);
    const ty = parseInt(top);

    console.log({ left, right, top, bottom });
    select(element);
    setStartPosition(sp);
    setOffset({ x: event.offsetX + parseInt(ox) + tx, y: event.offsetY + parseInt(oy) + ty });
  };
  const handleUp = (event: PointerEvent) => {
    options?.onMove?.(event);
    event.preventDefault();
    event.stopPropagation();

    setStartPosition(null);
    setMovePosition(null);
    setOffset(null);
    select(null);
    clearMove();
    clearUp();
  };
  const handleMove = (event: PointerEvent) => {
    options?.onMove?.(event);
    event.preventDefault();
    event.stopPropagation();

    setMovePosition({ x: event.clientX, y: event.clientY });
  };
  const onDown = (event: PointerEvent) => {
    handleDown(event);
    if (event.defaultPrevented) return;

    clearMove = createListener('pointermove', handleMove, false);
    clearUp = createListener('pointerup', handleUp, false);
  };

  return { selected, select, onDown, position, startPosition, movePosition, offset };
};

export const DevelopmentTools = () => {
  Devtools.createKeyboardShortcut();
  const [position, setPosition] = createStorageSignal('devtools-offset', { x: 0, y: 0 });
  const drag = createDrag();

  createEffect(() => {
    const pos = drag.position();
    if (!pos) return;

    setPosition(pos);
  });

  const dragTransform = createMemo(() => {
    const { x } = position();

    return { transform: `translate(${x}px, 0px)` };
  });

  return (
    <div class={s.tools}>
      <div
        onPointerDown={drag.onDown}
        class={cx(
          'transition-color fixed border border-t-0 top-0 right-0 p-1 rounded-b-sm bg-primary-white cursor-move',
          Devtools.active() && 'border-accent-5 bg-primary-2',
        )}
        style={dragTransform()}
      >
        <div class={s.expand}>
          <ButtonIcon
            cross={Devtools.active()}
            icon="CgToolbox"
            variant="text"
            class={s.expander}
            onClick={Devtools.toggle}
          />
        </div>
      </div>
      <div class={s.tabs} data-active={Devtools.active()}>
        <div class={s.tabulator}>
          <Tabulator
            id="devtool-tab"
            class="w-full gap-2"
            tabclass="text-white"
            tabs={[
              {
                id: 'tab-1',
                title: 'Available Icons',
                children: AvailableIconsTab,
                icon: 'CgAdd',
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};
