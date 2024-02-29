import type { Path, PathValue } from '../src/shared/types/path.js';
import type { BenchOptions } from 'vitest';
import { bench, describe } from 'vitest';

namespace PathImpl1 {
  export const get = <T extends Record<string, any>, TPath extends Path<T>>(obj: T, path: TPath): PathValue<T, TPath> =>
    path.split('.').reduce((acc, key) => acc?.[key], obj) as PathValue<T, TPath>;

  export const set = <T extends Record<string, any>, TPath extends Path<T>>(
    item: T,
    path: TPath,
    value: PathValue<T, TPath>,
  ) => {
    const segments = path.split('.') as TPath[];
    const lastKey = segments.pop();

    let target: T = item;
    for (let i = 0; i < segments.length; i++) {
      const key = segments[i] as TPath;

      if (!(key in target)) target[key] = {} as PathValue<T, TPath>;
      target = target[key];
    }

    if (lastKey) target[lastKey] = value;

    return item;
  };
}

namespace PathImpl2 {
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

describe('Bench - Path', () => {
  const item = { a: { b: { c: { d: { e: { f: { g: 0 } } } } } } };

  const options: BenchOptions = {
    iterations: 100_000,
    warmupIterations: 100_000,
  };

  describe('Get', () => {
    bench(
      'Path1.get',
      () => {
        PathImpl1.get(item, 'a.b.c.d.e.f.g');
      },
      options,
    );

    bench(
      'Path2.get',
      () => {
        PathImpl2.get(item, 'a.b.c.d.e.f.g');
      },
      options,
    );
  });

  describe('Set', () => {
    bench(
      'Path1.set',
      () => {
        PathImpl1.set(item, 'a.b.c.d.e.f.g', Math.random());
      },
      options,
    );

    bench(
      'Path2.set',
      () => {
        PathImpl2.set(item, 'a.b.c.d.e.f.g', Math.random());
      },
      options,
    );
  });
});
