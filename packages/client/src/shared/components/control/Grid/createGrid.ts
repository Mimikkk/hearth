import { createRows } from '@components/control/Grid/createRows.js';
import { createColumns } from '@components/control/Grid/createColumns.js';
import type { VirtualItem } from '@tanstack/virtual-core';
import { createMemo } from 'solid-js';

export interface GridOptions {
  ref: () => HTMLElement;
  items: unknown[];
  rows: number;
  columns: number;
  sizes: { width: number; height: number };
  gap: { x: number; y: number };
}

export const createGrid = (props: GridOptions) =>
  createMemo(() => {
    const rowCount = Math.ceil(props.items.length / props.columns);
    const height = ~~(props.rows * props.sizes.height + props.gap.y * (props.rows - 1));
    const width = ~~(props.columns * props.sizes.width + 16 + props.gap.x * (props.columns - 1));

    return {
      width,
      height,
      rows: createRows(props.ref, rowCount, props.sizes.height + props.gap.y),
      columns: createColumns(props.ref, props.columns, props.sizes.width + props.gap.x),
      styles: {
        container: {
          overflow: 'auto',
          height: `${height}px`,
          width: `${width}px`,
        },
        list: {
          position: 'relative',
          height: `${rowCount * props.sizes.height - props.gap.y}px`,
          width: `${props.columns * props.sizes.width - props.gap.x}px`,
        },
        item: (row: VirtualItem, column: VirtualItem) =>
          ({
            position: 'absolute',
            top: 0,
            width: `${column.size - props.gap.x}px`,
            height: `${row.size - props.gap.y}px`,
            transform: `translate(${column.start}px, ${row.start}px)`,
          }) as const,
      } as const,
      items: props.items,
    };
  });
