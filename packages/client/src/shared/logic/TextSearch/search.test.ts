import { describe, expect, it } from 'vitest';
import { TextSearch } from '@logic/TextSearch/textSearch.js';

describe('TextSearch', () => {
  it('should search for a string within an array', () => {
    const items = ['a', 'b', 'c', 'd', 'e', 'f'];

    const search = TextSearch.create(items);

    expect(search('a')).toEqual([
      {
        item: 'a',
        index: 0,
        matches: [{ score: 0, item: 'a', norm: 1, indices: [[0, 0]] }],
        score: 0,
      },
    ]);
  });

  it('should search for a string within a shallow object', () => {
    type Item = { name: string };
    const items: Item[] = [{ name: 'a' }, { name: 'b' }, { name: 'c' }, { name: 'd' }, { name: 'e' }, { name: 'f' }];

    const search = TextSearch.create(items, { keys: ['name'] });

    expect(search('a')).toEqual([
      {
        item: { name: 'a' },
        index: 0,
        matches: [{ score: 0, key: { path: 'name', weight: 1 }, item: 'a', norm: 1, indices: [[0, 0]] }],
        score: 0,
      },
    ]);
  });

  it('should search for a string within a deep object', () => {
    type Item = { name: { name: string } };
    const items: Item[] = [
      { name: { name: 'a' } },
      { name: { name: 'b' } },
      { name: { name: 'c' } },
      { name: { name: 'd' } },
      { name: { name: 'e' } },
      { name: { name: 'f' } },
    ];

    const search = TextSearch.create(items, { keys: ['name.name'] });

    expect(search('a')).toEqual([
      {
        item: { name: { name: 'a' } },
        index: 0,
        matches: [{ score: 0, key: { path: 'name.name', weight: 1 }, item: 'a', norm: 1, indices: [[0, 0]] }],
        score: 0,
      },
    ]);
  });

  it('should search for a string within array of a deep object', () => {
    type Item = { name: { name: string[] } };
    const items: Item[] = [{ name: { name: ['a', 'b'] } }, { name: { name: ['c', 'd'] } }];

    const search = TextSearch.create(items, { keys: ['name.name'] });

    expect(search('a')).toEqual([
      {
        item: { name: { name: ['a', 'b'] } },
        index: 0,
        matches: [
          {
            score: 0,
            key: { path: 'name.name', weight: 1 },
            index: 0,
            item: 'a',
            norm: 1,
            indices: [[0, 0]],
          },
        ],
        score: 0,
      },
    ]);
  });
});
