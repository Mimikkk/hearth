import type { TextSearch } from '@logic/TextSearch/textSearch.js';
import { isStringArray, normalize } from '@logic/TextSearch/utils.js';
import { Path } from 'a-path';

export type SearchRecord<T> = SearchRecord.ArrayString | SearchRecord.Object<T>;

export namespace SearchRecord {
  export const create = <T>(values: T[], configuration: TextSearch.Configuration<T>): SearchRecord<T>[] =>
    isStringArray(values)
      ? values.map(ArrayString.create)
      : values.map((item, index) => Object.create(item, index, configuration, 0));

  export type KeyEntry<T> = [TextSearch.Configuration.Key<T>, String | ArrayString[]];

  export interface String {
    item: string;
    norm: number;
  }

  export interface ArrayString {
    item: string;
    index: number;
    norm: number;
  }

  export interface Object<T> {
    item: T;
    index: number;
    depth: number;
    entries: KeyEntry<T>[];
    children?: Object<T>[];
  }

  namespace String {
    export const create = (item: string): String => ({ item, norm: normalize(item) });
  }

  namespace ArrayString {
    export const create = (item: string, index: number): ArrayString => ({ item, index, norm: normalize(item) });

    export const array = (value: string[]): ArrayString[] => {
      const records: ArrayString[] = [];
      type Item = [string | string[], number];
      const stack: Item[] = [[value, 0]];

      while (stack.length) {
        const [value, index] = stack.pop()!;

        if (typeof value === 'string') {
          records.unshift(ArrayString.create(value, index));
        } else {
          stack.push(...value.map((value, index) => [value, index] as Item));
        }
      }

      return records;
    };
  }

  namespace Object {
    export const create = <T>(
      item: T,
      index: number,
      configuration: TextSearch.Configuration<T>,
      depth: number,
    ): Object<T> => {
      const children: T[] | undefined = Path.get(item!, configuration.recursiveBy as never);

      return {
        item,
        index,
        depth,
        entries: KeyEntry.create(item, configuration.keys),
        children: children?.map((item, index) => create(item, index, configuration, depth + 1)),
      };
    };
  }

  namespace KeyEntry {
    export const create = <T>(item: T, keys: TextSearch.Configuration.Key<T>[]): KeyEntry<T>[] =>
      keys.map(key => {
        const value = Path.get(item as never, key.path as never);

        const records = Array.isArray(value) ? ArrayString.array(value) : String.create(value);

        return [key, records];
      });
  }
}
