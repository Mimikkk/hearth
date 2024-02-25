import type { AccessFn, IndexKey, IndexRecordObject, IndexRecordString } from '@logic/searcher/indexer.js';
import { SearchIndex } from '@logic/searcher/indexer.js';
import { SearchEngine } from '@logic/searcher/engine.js';

export interface TransformMatch {
  key?: string | string[];
  norm: number;
  score: number;
  indices?: [number, number][];
  value: string;
  index?: number;
}

export namespace TransformMatch {
  export const single = <T>({ indices, value, key, index }: Match<T>): TransformMatch => {
    return {
      key: key?.src,
      norm: 0,
      score: 0,
      indices,
      value,
      index: index && index > -1 ? index : undefined,
    };
  };

  export const create = <T>(matches: Match<T>[]): TransformMatch[] => matches.map(single);
}

export interface Match<T> {
  score: number;
  key?: IndexKey<T>;
  value: string;
  norm: number;
  indices?: [number, number][];
  index?: number;
}

export interface FormattedSearchResult<T> {
  item: T;
  index: number;
  matches: TransformMatch[];
  score: number;
}

export namespace FormattedSearchResult {
  export const create = <T>(results: SearchResult<T>[], items: T[]): FormattedSearchResult<T>[] =>
    results.map(({ index, matches, score }) => ({
      item: items[index],
      matches: TransformMatch.create(matches),
      score,
      index,
    }));
}

export interface SearchResult<T> {
  index: number;
  score: number;
  record: IndexRecordObject['children'][number] | IndexRecordObject['children'] | string;
  matches: Match<T>[];
}

export class TextSearch<T> {
  options: TextSearch.Options<T>;
  #index: SearchIndex<T>;
  #items: T[];

  constructor(items: T[], options?: Partial<TextSearch.Options<T>>) {
    this.options = {
      readFn: options?.readFn ?? TextSearch.readFn,
      keys: options?.keys ?? [],
      minMatchSize: options?.minMatchSize ?? 1,
      sortFn: options?.sortFn ?? TextSearch.sortFn,
      threshold: options?.threshold ?? 0.6,
      distance: options?.distance ?? 100,
      isCaseSensitive: options?.isCaseSensitive ?? false,
    };
    this.set(items);
  }

  set(items: T[]) {
    this.#items = items;
    this.#index = SearchIndex.create(items, this.options);
  }

  search(query: string, options?: Partial<TextSearch.SearchOptions>): FormattedSearchResult<T>[] {
    let results = typeof this.#items[0] === 'string' ? this.#searchString(query) : this.#searchObject(query);

    if (this.options.sortFn) results.sort(this.options.sortFn);
    if (options?.limit) results = results.slice(0, options.limit);

    return FormattedSearchResult.create(results, this.#items);
  }

  #searchString(query: string): SearchResult<T>[] {
    const search = SearchEngine.create(query, this.options);
    const { records } = this.#index;
    const results: SearchResult<T>[] = [];

    for (let i = 0, len = records.length; i < len; ++i) {
      const { value, index, norm } = records[i] as IndexRecordString;
      const { isMatch, score, indices } = search(value);

      if (!isMatch) continue;

      results.push({ record: value, index, matches: [{ score, value, norm, indices }], score: Math.pow(score, norm) });
    }

    return results;
  }

  #searchObject(query: string): SearchResult<T>[] {
    const search = SearchEngine.create(query, this.options);
    const { keys, records } = this.#index;
    const results: SearchResult<T>[] = [];

    for (let i = 0, len = records.length; i < len; ++i) {
      const { children: record, index } = (records as IndexRecordObject[])[i];

      const matches: Match<T>[] = [];

      for (let j = 0, len = keys.length; j < len; ++j) {
        const key = keys[j];
        const record = (records as IndexRecordObject[])[i].children[j];

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
      results.push({ index, record, matches, score: total });
    }

    return results;
  }
}

interface FnSearch<T> {
  (query: string, options?: Partial<TextSearch.SearchOptions>): FormattedSearchResult<T>[];
  set(items: T[]): void;
}

export namespace TextSearch {
  export const create = <T>(items: T[], options?: Partial<Options>): FnSearch<T> => {
    const search = new TextSearch<T>(items, options);

    const fn = (query: string, options?: Partial<TextSearch.SearchOptions>) => search.search(query, options);
    fn.set = (items: T[]) => search.set(items);

    return fn;
  };

  export type Key<T> = string | string[] | { name: string | string[]; weight?: number; access?: AccessFn<T> };

  export type SortFn<T> = (a: SearchResult<T>, b: SearchResult<T>) => number;
  export const sortFn: SortFn<unknown> = (a, b) => (a.score === b.score ? a.index - b.index : a.score - b.score);

  export type ReadFn<T> = (obj: T, path: string | string[]) => string | string[];
  export const readFn: ReadFn<unknown> = (item, path) => {
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
    sortFn: SortFn<T>;
    readFn: ReadFn<T>;
    keys: Key<T>[];
    isCaseSensitive: boolean;
    minMatchSize: number;
  }

  export interface SearchOptions {
    limit: number;
  }
}
