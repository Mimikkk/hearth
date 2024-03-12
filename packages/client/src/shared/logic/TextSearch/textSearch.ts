import { Path } from 'a-path';
import { SearchEngine } from '@logic/TextSearch/searchEngine.js';
import { SearchRecord } from '@logic/TextSearch/searchRecord.js';

export type TextSearch<T> = (query: string, limit?: number) => TextSearch.Result<T>[];

export namespace TextSearch {
  export const create = <T>(items: T[], options?: Partial<Options<T>>): TextSearch<T> => {
    const configuration = Configuration.from(options);
    const records = SearchRecord.create<T>(items, configuration.keys);

    return (query, limit) => {
      const results = search(SearchEngine.create(query, configuration), records);

      if (configuration.sortBy) results.sort(configuration.sortBy);
      if (limit) results.length = Math.min(results.length, limit);

      return results;
    };
  };

  export interface Result<T> {
    item: T;
    index: number;
    score: number;
    matches: Result.Match<T>[];
  }

  export namespace Result {
    export type Match<T> = Match.String | Match.Array<T> | Match.Value<T>;

    export namespace Match {
      export interface String {
        item: string;
        norm: number;
        indices: [number, number][];
        score: number;
      }

      export interface Array<T> {
        item: string;
        norm: number;
        indices: [number, number][];
        score: number;
        key: Configuration.Key<T>;
        index: number;
      }

      export interface Value<T> {
        item: string;
        norm: number;
        indices: [number, number][];
        score: number;
        key: Configuration.Key<T>;
      }
    }
  }

  const searchString = <T>({ item, index, norm }: SearchRecord.Array, engine: SearchEngine): Result<T> | null => {
    const { isMatch, score, indices } = engine(item);

    if (!isMatch) return null;
    return { item: item as T, index, matches: [{ score, item, norm, indices }], score: Math.pow(score, norm) };
  };

  const matchValue = <T>(
    { item, norm }: SearchRecord.Value,
    key: Configuration.Key<T>,
    engine: SearchEngine,
  ): Result.Match.Value<T> | null => {
    const { isMatch, score, indices } = engine(item);

    if (!isMatch) return null;
    return { score, key, item, norm, indices };
  };

  const notNull = <T>(value: T | null): value is T => value !== null;

  const matchArray = <T>(
    { item, norm, index }: SearchRecord.Array,
    key: Configuration.Key<T>,
    engine: SearchEngine,
  ): Result.Match.Array<T> | null => {
    const { isMatch, score, indices } = engine(item);

    if (!isMatch) return null;
    return { score, key, index, item, norm, indices };
  };

  const searchObject = <T>({ item, index, byKey }: SearchRecord.Object<T>, engine: SearchEngine): Result<T> | null => {
    const matches: (Result.Match.Value<T> | Result.Match.Array<T>)[] = [];

    for (const [key, records] of byKey) {
      if (Array.isArray(records)) {
        for (const record of records) {
          const match = matchArray(record, key, engine);
          if (match) matches.push(match);
        }
      } else {
        const match = matchValue(records, key, engine);

        if (match) matches.push(match);
      }
    }

    if (!matches.length) return null;

    const score = matches.reduce((acc, { key, norm, score }) => acc * Math.pow(score, key.weight * norm), 1);
    return { item, index, matches, score };
  };

  const searchRecord = <T>(record: SearchRecord<T>, engine: SearchEngine): Result<T> | null =>
    'norm' in record ? searchString<T>(record, engine) : searchObject(record, engine);

  const search = <T>(engine: SearchEngine, records: SearchRecord<T>[]): Result<T>[] =>
    records.map(record => searchRecord(record, engine)).filter(notNull);

  export interface Options<T> {
    threshold: number;
    distance: number;
    sortBy: Options.SortFn<T> | false;
    sensitive: boolean;
    minMatch: number;
    keys: Options.Key<T>[];
  }

  export namespace Options {
    export type SortFn<T> = typeof sort<T>;

    type StringKey<T> = Path.Of<T, string | string[]>;
    type ObjectKey<T> = { path: StringKey<T>; weight?: number };
    export type Key<T> = StringKey<T> | ObjectKey<T>;
  }

  export interface Configuration<T> extends Omit<Options<T>, 'keys'> {
    keys: Configuration.Key<T>[];
  }

  export namespace Configuration {
    export const from = <T>(options?: Partial<Options<T>>): Configuration<T> => ({
      sortBy: options?.sortBy ?? sort,
      sensitive: options?.sensitive ?? false,
      threshold: options?.threshold ?? 0.6,
      distance: options?.distance ?? 100,
      minMatch: options?.minMatch ?? 1,
      keys:
        options?.keys?.map(key =>
          typeof key === 'string' ? { path: key, weight: 1 } : { path: key.path, weight: key.weight ?? 1 },
        ) ?? [],
    });

    export type Key<T> = { path: Path.Of<T, string | string[]>; weight: number };
  }

  const sort = <T>(a: Result<T>, b: Result<T>): number => (a.score === b.score ? a.index - b.index : a.score - b.score);
}
