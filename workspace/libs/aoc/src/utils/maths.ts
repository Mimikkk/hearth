export const identity = <T>(item: T): T => item;

export const sumBy = <T>(items: T[], fn: (item: T, index: number) => number): number => {
  let sum = 0;
  for (let i = 0; i < items.length; ++i) {
    sum += fn(items[i], i);
  }
  return sum;
};

export const sum = (items: number[]): number => sumBy(items, identity);

export const countBy = <T>(items: T[], fn: (item: T, index: number) => unknown): number => {
  let count = 0;
  for (let i = 0; i < items.length; ++i) {
    if (fn(items[i], i)) count++;
  }
  return count;
};

export const count = (items: number[]): number => countBy(items, identity);
