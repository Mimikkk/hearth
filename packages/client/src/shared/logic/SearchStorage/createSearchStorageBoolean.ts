import { createStorageSignal } from '@logic/Storage/createStorageSignal.js';
import { createSearchString } from '@logic/Search/createSearchString.js';
import { Accessor, createMemo, Setter } from 'solid-js';

export const createSearchStorageBoolean = (
  searchId: string,
  storageId: string,
  fallback: boolean,
): [get: Accessor<boolean>, set: Setter<boolean>, toggle: () => void] => {
  const [storage, setStorage] = createStorageSignal(storageId, fallback ? 'y' : 'n');
  const [search, setSearch] = createSearchString(searchId, storage());

  if (storage() !== search()) setStorage(search());

  const get: Accessor<boolean> = createMemo(() => (search() ?? storage()) === 'y');

  const set: Setter<boolean> = value => {
    const update = value instanceof Function ? value(get()) : value;

    setSearch(update === 'y' ? 'y' : 'n');
    setStorage(update === 'y' ? 'y' : 'n');
  };
  const toggle = () => set(!get());

  return [get, set, toggle] as const;
};
