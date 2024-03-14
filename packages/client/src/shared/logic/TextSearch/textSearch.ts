import { Path } from 'a-path';
import { SearchEngine } from '@logic/TextSearch/searchEngine.js';
import { SearchRecord } from '@logic/TextSearch/searchRecord.js';
import { SearchResult } from '@logic/TextSearch/searchResult.js';

export type TextSearch<T> = (query: string, limit?: number) => SearchResult<T>[];

export namespace TextSearch {
  export type Result<T> = SearchResult<T>;

  export const create = <T>(items: T[], options?: Partial<Options<T>>): TextSearch<T> => {
    const configuration = Configuration.from(options);
    const records = SearchRecord.create<T>(items, configuration);

    return (query, limit) => {
      const results = SearchResult.find(SearchEngine.create(query, configuration), records);

      if (configuration.sortBy) results.sort(configuration.sortBy);
      if (limit) results.length = Math.min(results.length, limit);

      return results;
    };
  };

  export interface Options<T> {
    threshold: number;
    distance: number;
    sortBy: Options.SortFn<T> | false;
    sensitive: boolean;
    minMatch: number;
    keys: Options.Key<T>[];
    recursiveBy?: Path.Of<T, T[] | undefined>;
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
      recursiveBy: options?.recursiveBy,
      sensitive: options?.sensitive ?? false,
      threshold: options?.threshold ?? 0.6,
      distance: options?.distance ?? 100,
      minMatch: options?.minMatch ?? 1,
      sortBy: options?.sortBy ?? sort,
      keys: options?.keys?.map(Key.from) ?? [],
    });

    export type Key<T> = { path: Path.Of<T, string | string[]>; weight: number };

    namespace Key {
      export const from = <T>(key: Options.Key<T>): Configuration.Key<T> =>
        typeof key === 'string' ? { path: key, weight: 1 } : { path: key.path, weight: key.weight ?? 1 };
    }
  }

  const sort = <T>(a: Result<T>, b: Result<T>): number => (a.score === b.score ? a.index - b.index : a.score - b.score);
}
