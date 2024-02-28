import cx from 'clsx';

export type DragType = 'top-left' | 'top-right' | 'bottom-left' | 'top' | 'left' | 'bottom' | 'right' | 'bottom-right';

export interface DragCornerProps {
  onDoubleClick?(event: MouseEvent): void;
  onDrag(event: PointerEvent): void;
  class?: string;
  type: DragType;
}

export const classByType = {
  'top-left': 'cursor-nw-resize -ml-1.5 -mt-1.5  w-4 h-4 top-0 left-0',
  'top-right': 'cursor-ne-resize -mr-1.5 -mt-1.5 w-4 h-4 top-0 right-0',
  'bottom-right': 'cursor-se-resize -mr-1.5 -mb-1.5 w-4 h-4 bottom-0 right-0',
  'bottom-left': 'cursor-sw-resize -ml-1.5 -mb-1.5 w-4 h-4 bottom-0 left-0',
  top: 'cursor-row-resize -mt-1 w-full h-2 left-0 top-0',
  right: 'cursor-col-resize -mr-1 w-2 h-full top-0 right-0',
  bottom: 'cursor-row-resize -mb-1 w-full h-2 left-0 bottom-0',
  left: 'cursor-col-resize -ml-1 w-2 h-full top-0 left-0',
};

export const DragCorner = (props: DragCornerProps) => (
  <div
    onDblClick={props.onDoubleClick}
    onPointerDown={props.onDrag}
    class={cx('absolute transition-all hover:bg-accent-5 active:bg-accent-6', classByType[props.type], props.class)}
  />
);
