import { SearchIndex } from './searchIndex.js';
import { SearchEngine } from './searchEngine.js';
import { Path } from 'a-path';

const searchString = <T>(
  query: string,
  { records }: SearchIndex<T>,
  options: TextSearch.Options<T>,
): TextSearch.Result<string>[] => {
  const search = SearchEngine.create(query, options);
  const results: TextSearch.Result<string>[] = [];

  for (let i = 0, len = records.length; i < len; ++i) {
    const { item, index, norm } = records[i] as SearchIndex.RecordString;
    const { isMatch, score, indices } = search(item);

    if (!isMatch) continue;

    results.push({ item, index, matches: [{ score, value: item, norm, indices }], score: Math.pow(score, norm) });
  }

  return results;
};

const searchObject = <T>(
  query: string,
  { keys, records }: SearchIndex<T>,
  options: TextSearch.Options<T>,
): TextSearch.Result<T>[] => {
  const search = SearchEngine.create(query, options);
  const results: TextSearch.Result<T>[] = [];

  for (let i = 0, len = records.length; i < len; ++i) {
    const { item, index, children } = records[i] as SearchIndex.RecordObject<T>;
    const matches = [];

    for (let j = 0, len = keys.length; j < len; ++j) {
      const key = keys[j];
      const record = children[j];

      if (Array.isArray(record)) {
        for (let index = 0, len = record.length; index < len; ++index) {
          const { item: value, norm } = record[index];
          const { isMatch, score, indices } = search(value);

          if (isMatch) matches.push({ score, key, value, index, norm, indices });
        }
      } else {
        const { item: value, norm } = record;
        const { isMatch, score, indices } = search(value);

        if (isMatch) matches.push({ score, key, value, norm, indices });
      }
    }

    if (!matches.length) continue;

    let total = 1;
    for (let j = 0, len = matches.length; j < len; ++j) {
      const { key, norm, score } = matches[j];

      total *= Math.pow(score, (key?.weight ?? 1) * norm);
    }

    results.push({ item, index, matches, score: total });
  }

  return results;
};

export interface TextSearch<T> {
  (query: string, limit?: number): TextSearch.Result<T>[];
}

export namespace TextSearch {
  export const create = <T>(items: T[], options?: Partial<TextSearch.Options<T>>): TextSearch<T> => {
    const configuration = TextSearch.Options.create(options);
    const index = SearchIndex.create<T>(items, configuration);
    const search = typeof items[0] === 'string' ? searchString : searchObject;

    return (query, limit) => {
      const results = search(query, index, configuration) as Result<T>[];

      if (configuration.sortBy) results.sort(configuration.sortBy);
      if (limit) results.length = Math.min(results.length, limit);

      return results;
    };
  };

  export type ValueKey<T> = Path.Of<T, string | string[]>;
  export namespace ValueKey {
    export const is = <T>(key: Key<T>): key is ValueKey<T> => typeof key === 'string';
  }
  export type ObjectKey<T> = { path: ValueKey<T>; weight?: number };
  export type Key<T> = ValueKey<T> | ObjectKey<T>;

  export type SortFn<T = any> = (a: Result<T>, b: Result<T>) => number;
  export const sort: SortFn = (a, b) => (a.score === b.score ? a.index - b.index : a.score - b.score);

  export type Options<T> = {
    threshold: number;
    distance: number;
    sortBy: SortFn<T>;
    sensitive: boolean;
    minMatch: number;
    keys: Key<T>[];
  };

  export namespace Options {
    export const create = <T>(options?: Partial<TextSearch.Options<T>>): TextSearch.Options<T> => ({
      sortBy: options?.sortBy ?? TextSearch.sort,
      sensitive: options?.sensitive ?? false,
      threshold: options?.threshold ?? 0.6,
      distance: options?.distance ?? 100,
      minMatch: options?.minMatch ?? 1,
      keys: options?.keys ?? [],
    });
  }

  export interface Result<T> {
    item: T;
    index: number;
    score: number;
    matches: Result.Match<T>[];
  }

  export namespace Result {
    export interface Match<T> {
      value: string;
      norm: number;
      indices: [number, number][];
      score: number;
      key?: SearchIndex.Key<T>;
      index?: number;
    }
  }
}
