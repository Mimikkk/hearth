import { createStore, type SetStoreFunction, type Store } from 'solid-js/store';
import { Accessor, createEffect, createSignal, Setter } from 'solid-js';
import { Storage } from '@logic/Storage/Storage.js';

type ClearFn = () => void;

export const createStorageSignal = <T>(
  name: string,
  initial: T,
): [get: Accessor<T>, set: Setter<T>, clear: ClearFn] => {
  const [get, set] = createSignal(Storage.read(name, initial));

  createEffect(() => {
    const value = get();

    if (value === undefined) {
      Storage.clear(name);
    } else {
      Storage.set(name, value);
    }
  });

  const clear = () => Storage.clear(name);

  return [get, set, clear];
};

export const createStorageStore = <T extends {}>(
  name: string,
  initial: T,
): [get: Store<T>, set: SetStoreFunction<T>, clear: ClearFn] => {
  const [get, set] = createStore(Storage.read(name, initial) as T);

  createEffect(() => Storage.set(name, get));

  const clear = () => Storage.clear(name);

  return [get, set, clear];
};
