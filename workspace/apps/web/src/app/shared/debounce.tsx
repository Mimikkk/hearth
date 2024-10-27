/**
 * A debounced function that also has a flush method.
 */
export type DebouncedFn<Fn extends (...args: any[]) => any> =
  & ((...args: Parameters<Fn>) => void)
  & { flush(): void };

/**
 * Creates a debounced function that also has a flush method.
 */
export const debounce = <Fn extends (...args: any[]) => any>(
  fn: Fn,
  delay: number,
): DebouncedFn<Fn> => {
  if (delay <= 0) return fn as unknown as DebouncedFn<Fn>;
  let timeoutId: ReturnType<typeof setTimeout>;
  let lastArgs: Parameters<Fn> | undefined;

  const flush = () => {
    if (lastArgs) {
      clearTimeout(timeoutId);
      fn(...lastArgs);
      lastArgs = undefined;
    }
  };

  const result: DebouncedFn<Fn> = (...args) => {
    lastArgs = args;

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
      lastArgs = undefined;
    }, delay);
  };
  result.flush = flush;

  return result;
};
