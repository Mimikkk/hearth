import type { Signal } from "solid-js";
import { createEffect, createSignal } from "solid-js";
import { debounce } from "./debounce.tsx";

/**
 * Options for the `createStorageSignal` function.
 *
 * @param Some - The type of the signal's value.
 * @param None - The type of the signal's value when it is empty.
 */
export interface CreateStorageSignalOptions<Some, None> {
  /** The key to use for the storage. */
  key: string;
  /** The initial value of the signal. */
  initial?: Some;
  /** The value to use when the signal is empty. */
  empty?: None;
  /** A function to determine if a value is empty. */
  clear?: (value: Some | None) => value is None;
  /** A function to decode a value from storage. */
  decode?: (value: string | null) => Some | None;
  /** A function to encode a value to storage. */
  encode?: (value: Some) => string;
  /** The storage to use. */
  storage?: Storage;
  /** The debounce time in milliseconds. */
  debounceMs?: number;
}

export type StorageSignal<Some, None> = [
  ...Signal<Some | None>,
  {
    /** Force immediate storage update */
    flush: () => void;
    /** Clear the storage value */
    clear: () => void;
  },
];
/**
 * Create a signal that is persisted in storage.
 *
 * @param options - Options for the signal.
 * @returns A signal that is persisted in storage.
 */
export const createStorageSignal = <Some, None = null>({
  key,
  initial,
  empty = null as None,
  clear = (value): value is None => value === empty,
  decode = (value) => {
    try {
      return value ? JSON.parse(value) : empty;
    } catch {
      return empty;
    }
  },
  encode = JSON.stringify,
  storage = localStorage,
  debounceMs = 100,
}: CreateStorageSignalOptions<Some, None>): StorageSignal<Some, None> => {
  const [get, set] = createSignal<Some | None>(initial ?? decode(storage.getItem(key)));

  const updateStorage = (value: Some | None) => {
    if (clear(value)) {
      storage.removeItem(key);
    } else {
      storage.setItem(key, encode(value));
    }
  };

  const debounced = debounce(updateStorage, debounceMs);

  createEffect(() => debounced(get()));

  return [
    get,
    set,
    {
      flush: debounced.flush,
      clear: () => set(() => empty),
    },
  ] as const;
};
