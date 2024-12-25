export interface MemoizedFn<Fn extends (...args: any[]) => any, K = string> {
  (...args: Parameters<Fn>): ReturnType<Fn>;
  cache: Map<K, ReturnType<Fn>>;
}
export const memoize = <Fn extends (...args: any[]) => any, K = string>(
  fn: Fn,
  createId: (...args: Parameters<Fn>) => K = (...args) => args.join(",") as K,
): MemoizedFn<Fn, K> => {
  const cache = new Map<K, ReturnType<Fn>>();

  const result = ((...args) => {
    const id = createId(...args);

    let value = cache.get(id);
    if (value !== undefined) return value!;

    value = fn(...args);
    cache.set(id, value!);
    return value;
  }) as MemoizedFn<Fn, K>;
  result.cache = cache;

  return result;
};
