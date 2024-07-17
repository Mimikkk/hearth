export type Const<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends Map<infer K, infer V>
    ? ReadonlyMap<Const<K>, Const<V>>
    : T extends Set<infer V>
      ? ReadonlySet<Const<V>>
      : { readonly [P in keyof T]: Const<T[P]> };

export const temp = <T extends { from(item: any): any }>(fn: () => T): ((param?: Parameters<T['from']>[0]) => T) => {
  let value: T & { from(item: any): T };

  return from => {
    if (value === undefined) value = fn();
    return from ? value.from(from) : value;
  };
};
