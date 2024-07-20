export type Const<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends Map<infer K, infer V>
    ? ReadonlyMap<Const<K>, Const<V>>
    : T extends Set<infer V>
      ? ReadonlySet<Const<V>>
      : { readonly [P in keyof T]: Const<T[P]> };

export const lazy = <T>(fn: () => T): (() => T) => {
  let value: T | undefined;

  return () => {
    if (value === undefined) value = fn();
    return value;
  };
};
