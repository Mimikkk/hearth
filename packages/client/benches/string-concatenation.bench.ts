import { bench, BenchOptions, describe } from 'vitest';

describe('Bench - String Concatenation', () => {
  const join1 = (a: string, b: string) => a + '.' + b;
  const join2 = (a: string, b: string) => `${a}.${b}`;

  const options: BenchOptions = {
    iterations: 1000_000,
    warmupIterations: 1000_000,
  };

  bench(
    'join - (+ operator)',
    () => {
      join1(Math.random().toString(), Math.random().toString());
    },
    options,
  );

  bench(
    'join - (template string)',
    () => {
      join2(Math.random().toString(), Math.random().toString());
    },
    options,
  );
});
