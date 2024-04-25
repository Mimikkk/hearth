import { bench, BenchOptions, describe } from 'vitest';

const _global = { x: 0, y: 0 };
describe('Bench - Function Scope Access', () => {
  const options: BenchOptions = {
    iterations: 1000_000,
    warmupIterations: 1000_000,
  };

  describe('Global Scope Access Function', () => {
    const create = (x: number, y: number) => ({ x, y });
    const reuse = (x: number, y: number) => {
      _global.x = x;
      _global.y = y;

      return _global;
    };

    bench(
      'new - (object creation)',
      () => {
        const _ = create(Math.random(), Math.random());
      },
      options,
    );

    bench(
      'reuse - (object creation)',
      () => {
        const _ = reuse(Math.random(), Math.random());
      },
      options,
    );
  });

  describe('Global Scope Access Class', () => {
    class Reuse {
      method(x: number, y: number) {
        _global.x = x;
        _global.y = y;

        return _global;
      }
    }

    class Create {
      method(x: number, y: number) {
        return { x, y };
      }
    }

    bench(
      'new - (object creation)',
      () => {
        const _ = new Create().method(Math.random(), Math.random());
      },
      options,
    );

    bench(
      'reuse - (object creation)',
      () => {
        const _ = new Reuse().method(Math.random(), Math.random());
      },
      options,
    );
  });
});
