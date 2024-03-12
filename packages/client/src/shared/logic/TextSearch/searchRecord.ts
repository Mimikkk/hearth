import type { TextSearch } from '@logic/TextSearch/textSearch.js';
import { isStringArray, normalize } from '@logic/TextSearch/utils.js';
import { Path } from 'a-path';

export type SearchRecord<T> = SearchRecord.String | SearchRecord.Object<T>;

export namespace SearchRecord {
  export const create = <T>(values: T[], keys: TextSearch.Configuration.Key<T>[]): SearchRecord<T>[] =>
    isStringArray(values) ? values.map(String.create) : values.map((item, index) => Object.create(item, index, keys));

  export interface String {
    item: string;
    index: number;
    norm: number;
  }

  export interface Object<T> {
    item: T;
    index: number;
    byKey: [TextSearch.Configuration.Key<T>, Value | String[]][];
  }

  export interface Value {
    item: string;
    norm: number;
  }

  namespace Value {
    export const create = (item: string): Value => ({ item, norm: normalize(item) });
  }

  namespace String {
    export const create = (item: string, index: number): String => ({ item, index, norm: normalize(item) });
  }

  namespace Object {
    const handleArray = (value: string[]): String[] => {
      const records: String[] = [];
      type Item = [string | string[], number];
      const stack: Item[] = [[value, 0]];

      while (stack.length) {
        const [value, index] = stack.pop()!;

        if (typeof value === 'string') {
          records.unshift(String.create(value, index));
        } else {
          stack.push(...value.map((value, index) => [value, index] as Item));
        }
      }

      return records;
    };

    export const create = <T>(item: T, index: number, keys: TextSearch.Configuration.Key<T>[]): Object<T> => ({
      item,
      index,
      byKey: keys.map(key => {
        const path = Path.get(item as never, key.path as never);
        const value = Array.isArray(path) ? handleArray(path) : Value.create(path);

        return [key, value];
      }),
    });
  }
}
