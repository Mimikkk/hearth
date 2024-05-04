import { bench, BenchOptions, describe } from 'vitest';

interface ExampleOptions {
  a: string;
  b: number;
  c: boolean;
}

const defaults: ExampleOptions = {
  a: 'a',
  b: 1,
  c: true,
};

namespace Impl1 {
  export const create = (options?: Partial<ExampleOptions>): ExampleOptions => {
    if (!options) return defaults;

    return {
      a: options.a ?? defaults.a,
      b: options.b ?? defaults.b,
      c: options.c ?? defaults.c,
    };
  };
}

namespace Impl2 {
  export const create = (options?: Partial<ExampleOptions>): ExampleOptions => ({ ...defaults, ...options });
}

namespace Impl3 {
  export const create = (options?: Partial<ExampleOptions>): ExampleOptions => Object.assign({}, defaults, options);
}

namespace Impl4 {
  export const create = (options?: Partial<ExampleOptions>): ExampleOptions => ({
    a: options?.a ?? defaults.a,
    b: options?.b ?? defaults.b,
    c: options?.c ?? defaults.c,
  });
}

namespace Impl5 {
  export const create = (options: Partial<ExampleOptions> = defaults): ExampleOptions => {
    if (options === defaults) return defaults;

    options.a ??= defaults.a;
    options.b ??= defaults.b;
    options.c ??= defaults.c;

    return options as ExampleOptions;
  };
}

namespace final_pattern {
  export interface Configuration {
    a: string;
  }

  export interface Options extends Partial<Configuration> {}

  export const initial: Configuration = { a: 'a' };
  export const configure = (options?: Options): Configuration => ({ a: options?.a ?? initial.a });
}

describe('Bench - Configuration Pattern', () => {
  const options: BenchOptions = {
    iterations: 1000_000,
    warmupIterations: 1000_000,
  };

  const benchFn = (name: string, method: () => void) => {
    bench(
      name,
      () => {
        method();
      },
      options,
    );
  };

  describe('With no options', () => {
    benchFn('Impl1', Impl1.create);
    benchFn('Impl2', Impl2.create);
    benchFn('Impl3', Impl3.create);
    benchFn('Impl4', Impl4.create);
    benchFn('Impl5', Impl5.create);
  });

  describe('With options', () => {
    benchFn('Impl1', () => Impl1.create({ a: 'a', c: true }));
    benchFn('Impl2', () => Impl2.create({ a: 'a', c: true }));
    benchFn('Impl3', () => Impl3.create({ a: 'a', c: true }));
    benchFn('Impl4', () => Impl4.create({ a: 'a', c: true }));
    benchFn('Impl5', () => Impl5.create({ a: 'a', c: true }));
  });
});
