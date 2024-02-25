import { SearchIndex } from '@logic/searcher/indexer.js';
import { SearchEngine } from '@logic/searcher/engine.js';

export interface Match<T> {
  value: string;
  norm: number;
  indices: [number, number][];
  score: number;
  key?: SearchIndex.Key<T>;
  index?: number;
}

type SearchFn = <T>(
  query: string,
  index: SearchIndex<T>,
  options: TextSearch.Options,
) => {
  index: number;
  score: number;
  matches: Match<T>[];
}[];

const searchString: SearchFn = (query, { records }, options) => {
  const search = SearchEngine.create(query, options);
  const results = [];

  for (let i = 0, len = records.length; i < len; ++i) {
    const { value, index, norm } = records[i] as SearchIndex.RecordString;
    const { isMatch, score, indices } = search(value);

    if (!isMatch) continue;

    results.push({ index, matches: [{ score, value, norm, indices }], score: Math.pow(score, norm) });
  }

  return results;
};

const searchObject: SearchFn = (query, { keys, records }, options) => {
  const search = SearchEngine.create(query, options);
  const results = [];

  for (let i = 0, len = records.length; i < len; ++i) {
    const { index, children } = records[i] as SearchIndex.RecordObject;
    const matches = [];

    for (let j = 0, len = keys.length; j < len; ++j) {
      const key = keys[j];
      const record = children[j];

      if (Array.isArray(record)) {
        for (let index = 0, len = record.length; index < len; ++index) {
          const { value, norm } = record[index];
          const { isMatch, score, indices } = search(value);

          if (isMatch) matches.push({ score, key, value, index, norm, indices });
        }
      } else {
        const { value, norm } = record;
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
    results.push({ index, matches, score: total });
  }

  return results;
};

const createConfiguration = <T>(options?: Partial<TextSearch.Options<T>>): TextSearch.Options<T> => ({
  readBy: options?.readBy ?? TextSearch.read,
  sortBy: options?.sortBy ?? TextSearch.sort,
  sensitive: options?.sensitive ?? false,
  threshold: options?.threshold ?? 0.6,
  distance: options?.distance ?? 100,
  minMatch: options?.minMatch ?? 1,
  keys: options?.keys ?? [],
});

export interface TextSearch<T> {
  (query: string, limit?: number): TextSearch.Result<T>[];
}

export namespace TextSearch {
  export const create = <T>(items: T[], options?: Partial<TextSearch.Options>): TextSearch<T> => {
    const configuration = createConfiguration(options);
    const index = SearchIndex.create<T>(items, configuration);
    const search = typeof items[0] === 'string' ? searchString : searchObject;

    return (query, limit) => {
      const results = search(query, index, configuration).map(({ index, matches, score }) => ({
        item: items[index],
        matches,
        score,
        index,
      }));

      if (configuration.sortBy) results.sort(configuration.sortBy);
      if (limit) results.length = Math.min(results.length, limit);

      return results;
    };
  };

  export type Key<T> =
    | string
    | string[]
    | { name: string | string[]; weight?: number; access?: SearchIndex.AccessFn<T> };

  export type SortFn<T> = (a: Result<T>, b: Result<T>) => number;
  export const sort: SortFn<unknown> = (a, b) => (a.score === b.score ? a.index - b.index : a.score - b.score);

  export type ReadFn<T> = (obj: T, path: string | string[]) => string | string[];
  export const read: ReadFn<unknown> = (item, path) => {
    const items: string[] = [];
    path = typeof path === 'string' ? path.split('.') : path;

    let isArray = false;
    const flatten = (item: any, depth: number): void => {
      const key = path[depth];
      const value = item[key];

      const type = typeof value;
      if (depth === path.length - 1 && type === 'string') {
        items.push(value);
      } else if (Array.isArray(value)) {
        isArray = true;

        for (let i = 0, len = value.length; i < len; ++i) flatten(value[i], depth + 1);
      } else if (path.length) flatten(value, depth + 1);
    };

    flatten(item, 0);

    return isArray ? items : items[0];
  };

  export interface Options<T = unknown> {
    threshold: number;
    distance: number;
    sortBy: SortFn<T>;
    readBy: ReadFn<T>;
    keys: Key<T>[];
    sensitive: boolean;
    minMatch: number;
  }

  export interface Result<T> {
    item: T;
    index: number;
    score: number;
    matches: Match<T>[];
  }
}
