import { Accessor, createMemo, Setter } from 'solid-js';
import { Search } from '@logic/Search/Search.js';

export const createSearchSignal = <T>(
  param: string,
  fallback: T,
  encode: (value: T) => string,
  decode: (value: string) => T,
): [get: Accessor<T>, set: Setter<T>, clear: () => void] => {
  const initial = Search.params().get(param);
  if (!initial && fallback) Search.update(params => params.set(param, encode(fallback)));

  const get: Accessor<T> = createMemo(() => decode(Search.params().get(param)!));
  const update = <Setter<T>>(value => {
    const updated = (value instanceof Function ? value(get()) : value) as T;

    Search.update(params => params.set(param, encode(updated)));
  });
  const clear = () => Search.update(params => params.delete(param));

  return [get, update, clear] as const;
};
