import type { JSX } from 'solid-js';
import { For, mergeProps } from 'solid-js';
import cx from 'clsx';
import { createGrid } from '@components/control/Grid/createGrid.js';

export interface GridProps<T> {
  class?: string;
  containerclass?: string;
  itemclass?: string;
  rows: number;
  columns?: number;
  items: T[];
  sizes: { width: number; height: number };
  gap?: { x: number; y: number } | number;
  children(item: T, index: number, row: number, column: number): JSX.Element;
  itemprops?: (item: T, index: number, row: number, column: number) => JSX.HTMLAttributes<HTMLDivElement>;
  after?: (items: T[]) => JSX.Element;
}

const After = (items: unknown[]) => (
  <div>
    Total: <span class="text-amber-300">{items.length}</span>
  </div>
);

const initial = { columns: 1, after: After } as const;
export const Grid = <T,>(props: GridProps<T>) => {
  const $ = mergeProps(initial, props, {
    gap: {
      x: typeof props.gap === 'number' ? props.gap : props.gap?.x ?? 0,
      y: typeof props.gap === 'number' ? props.gap : props.gap?.y ?? 0,
    },
  });

  let ref!: HTMLDivElement;
  const grid = createGrid(mergeProps({ ref: () => ref }, $));

  return (
    <div class={$.containerclass}>
      <div ref={ref} style={grid().styles.container} class={$.class}>
        <div style={grid().styles.list}>
          <For each={grid().rows.items}>
            {row => (
              <For each={grid().columns.items}>
                {column => {
                  let index = row.index * $.columns + column.index;
                  const item = $.items[index];
                  if (!item) return null;

                  return (
                    <div
                      class={cx('overflow-hidden', $.itemclass)}
                      style={grid().styles.item(row, column)}
                      {...$.itemprops?.(item, index, row.index, column.index)}
                    >
                      {$.children(item, index, row.index, column.index)}
                    </div>
                  );
                }}
              </For>
            )}
          </For>
        </div>
      </div>
      {$.after?.($.items)}
    </div>
  );
};
