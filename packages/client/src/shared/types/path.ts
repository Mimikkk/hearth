type Primitive = null | undefined | string | number | boolean | symbol | bigint;

type IsTuple<T extends readonly any[]> = number extends T['length'] ? false : true;

type TupleKeys<T extends readonly any[]> = Exclude<keyof T, keyof any[]>;

type Join<A extends string | number, B> = B extends Primitive ? `${A}` : `${A}` | `${A}.${Path<B>}`;

type ArrayPathConcat<TKey extends string | number, TValue> = TValue extends Primitive
  ? never
  : TValue extends readonly (infer U)[]
    ? U extends Primitive
      ? never
      : `${TKey}` | `${TKey}.${ArrayPath<TValue>}`
    : `${TKey}.${ArrayPath<TValue>}`;

type ArrayPath<T> = T extends readonly (infer V)[]
  ? IsTuple<T> extends true
    ? {
        [K in TupleKeys<T>]-?: ArrayPathConcat<K & string, T[K]>;
      }[TupleKeys<T>]
    : ArrayPathConcat<number, V>
  : {
      [K in keyof T]-?: ArrayPathConcat<K & string, T[K]>;
    }[keyof T];

export type PathValue<T, TPath extends Path<T> | ArrayPath<T>> = T extends any
  ? TPath extends `${infer K}.${infer R}`
    ? K extends keyof T
      ? R extends Path<T[K]>
        ? undefined extends T[K]
          ? PathValue<T[K], R> | undefined
          : PathValue<T[K], R>
        : never
      : K extends `${number}`
        ? T extends readonly (infer V)[]
          ? PathValue<V, R & Path<V>>
          : never
        : never
    : TPath extends keyof T
      ? T[TPath]
      : TPath extends `${number}`
        ? T extends readonly (infer V)[]
          ? V
          : never
        : never
  : never;

export type Path<T> = T extends readonly (infer V)[]
  ? IsTuple<T> extends true
    ? { [K in TupleKeys<T>]-?: Join<K & string, T[K]> }[TupleKeys<T>]
    : Join<number, V>
  : { [K in keyof T]-?: Join<K & string, T[K]> }[keyof T];

type BreakDownObject<O, R = void> = {
  [K in keyof O as string]: K extends string
    ? R extends string
      ? EndPath<O[K], `${R}.${K}`>
      : EndPath<O[K], K>
    : never;
};

export type EndPath<O, R = void> = O extends string
  ? R extends string
    ? R
    : never
  : BreakDownObject<O, R>[keyof BreakDownObject<O, R>];

export namespace Path {
  export const get = <T extends Record<string, any>, TPath extends Path<T>>(
    obj: T,
    path: TPath,
  ): PathValue<T, TPath> => {
    const segments = path.split('.') as TPath[];

    let result = obj;
    for (let i = 0, it = segments.length; i < it; ++i) result = result[segments[i]];

    return result as PathValue<T, TPath>;
  };

  export const set = <T extends Record<string, any>, TPath extends Path<T>>(
    item: T,
    path: TPath,
    value: PathValue<T, TPath>,
  ) => {
    const segments = path.split('.') as TPath[];

    let target: T = item;
    for (let i = 0, it = segments.length - 1; i < it; ++i) {
      const key = segments[i];

      if (!(key in target)) target[key] = {} as PathValue<T, TPath>;
      target = target[key];
    }

    target[segments[segments.length - 1]] = value;

    return item;
  };
}
