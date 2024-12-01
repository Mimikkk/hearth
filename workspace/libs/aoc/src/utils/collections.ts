export const createCounter = <T>(items: T[]): Map<T, number> => {
  const counts = new Map<T, number>();

  for (let i = 0; i < items.length; ++i) {
    const value = items[i];
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return counts;
};
