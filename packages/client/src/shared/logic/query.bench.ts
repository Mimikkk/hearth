import { bench, BenchFunction, describe } from 'vitest';
import { createRoot } from 'solid-js';
import { faker } from '@faker-js/faker';
import { times } from 'lodash-es';
import { createQueryable as createQueryable1 } from '@logic/createQueryable.base.js';
import { createQueryable as createQueryable2 } from '@logic/createQueryable.opt.js';
const fn =
  <Fn extends () => void>(fn: Fn): BenchFunction =>
  async () =>
    createRoot(async dispose => (await fn(), dispose()));

describe('Query - benchmark', () => {
  const items = times(25000, () => faker.lorem.words({ min: 1, max: 5 }));

  const test = (set: (query: string) => void, queried: () => void) => {
    set('abc');
    queried();

    set('abcd');
    queried();
  };

  bench(
    'Fuse',
    fn(() => {
      const [queried, , setQuery] = createQueryable1(items, {
        threshold: 0.4,
        isCaseSensitive: false,
      });

      test(setQuery, queried);
    }),
  );

  bench(
    'Fuse (opt)',
    fn(() => {
      const [queried, , setQuery] = createQueryable2(items, {
        threshold: 0.4,
        sensitive: false,
      });

      test(setQuery, queried);
    }),
  );
});
