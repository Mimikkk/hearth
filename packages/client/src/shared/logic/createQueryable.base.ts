import type { FuseResult, IFuseOptions } from 'fuse.js';
import Fuse from './fuse.basic.mjs';
import { type Accessor, createEffect, createMemo, createSignal, on, type Setter } from 'solid-js';
import { Defer } from '@utils/constants.js';

const extract = <T>({ item }: FuseResult<T>) => item;

export type QueryableReturn<T> = [results: Accessor<T[]>, get: Accessor<string>, set: Setter<string>];

export interface SearchOptions<T> extends IFuseOptions<T> {
  limit?: number;
}

const createQueryableStatic = <T>(items: T[], options?: SearchOptions<T>): QueryableReturn<T> => {
  const fuse = new Fuse(items, options);

  const search = (query: string, limit: undefined | number = options?.limit) =>
    query === ''
      ? items
      : limit === undefined
        ? fuse.search(query).map(extract)
        : fuse.search(query, { limit }).map(extract);

  const [get, set] = createSignal('');
  const queried = createMemo(() => search(get()));

  return [queried, get, set];
};

const createQueryableSignal = <T>(items: Accessor<T[]>, options?: SearchOptions<T>): QueryableReturn<T> => {
  const initial = items();
  const fuse = new Fuse(initial, options);
  const search = (query: string, limit: undefined | number = options?.limit) =>
    query === '' ? items() : fuse.search(query, limit !== undefined ? { limit } : undefined).map(extract);

  const [get, set] = createSignal('');
  const [queried, setQueried] = createSignal(initial);

  createEffect(
    on(
      items,
      items => {
        fuse.setCollection(items);
        setQueried(search(get()));
      },
      Defer,
    ),
  );

  createEffect(() => setQueried(search(get())));

  return [queried, get, set];
};

export const createQueryable = <T>(items: Accessor<T[]> | T[], options?: SearchOptions<T>): QueryableReturn<T> =>
  typeof items === 'function' ? createQueryableSignal(items, options) : createQueryableStatic(items, options);
