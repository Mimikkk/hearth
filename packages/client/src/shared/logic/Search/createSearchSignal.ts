import { Accessor, createSignal, Setter } from 'solid-js';
import { Search } from '@logic/Search/Search.js';

export const createSearchSignal = <T>(
  param: string,
  fallback: T,
  encode: (value: T) => string,
  decode: (value: string) => T,
): [get: Accessor<T>, set: Setter<T>, clear: () => void] => {
  const initial = Search.params().get(param);
  if (!initial && fallback) Search.update(params => params.set(param, encode(fallback)));

  const [get, set] = createSignal<T>(decode(initial!));

  const setter = <Setter<T>>(value => {
    const updated = (value instanceof Function ? value(get()) : value) as T;

    Search.update(params => params.set(param, encode(updated)));
    set(() => updated);
  });
  const clear = () => Search.update(params => params.delete(param));

  return [get, setter, clear] as const;
};
