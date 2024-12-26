export interface MemoizedFn<This, Fn extends (this: This, ...args: any[]) => any, K = string> {
  (this: This, ...args: Parameters<Fn>): ReturnType<Fn>;
  cache: Map<K, ReturnType<Fn>>;
}

export const memoize = <This, Fn extends (this: This, ...args: any[]) => any, K = string>(
  fn: Fn,
  createId: (this: This, ...args: Parameters<Fn>) => K = (...args) => args.join(",") as K,
): MemoizedFn<This, Fn, K> => {
  const result: MemoizedFn<This, Fn, K> = function self(...args) {
    const cache = self.cache;

    const id = createId.apply(this, args);

    if (cache.has(id)) return cache.get(id)!;

    const value = fn.apply(this, args);
    cache.set(id, value);
    return value;
  };
  result.cache = new Map();

  return result;
};

export const memoized = <This extends object, Fn extends (this: This, ...args: any[]) => any, K = string>(
  createId: (this: This, ...args: Parameters<Fn>) => K = (...args) => args.join(",") as K,
) => {
  const map = new WeakMap<This, Map<K, ReturnType<Fn>>>();

  return function (value: Fn): Fn {
    const memo = memoize(value, createId);

    const result = function (this: NoInfer<This>, ...args: Parameters<Fn>) {
      let cache = map.get(this);

      if (cache === undefined) {
        cache = new Map();

        map.set(this, cache);
      }

      memo.cache = cache;
      return memo.apply(this, args);
    };

    return result as Fn;
  };
};
