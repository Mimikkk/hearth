import type { Accessor, Setter } from 'solid-js';
import { createSignal } from 'solid-js';

export const createString = (
  fallback: string = '',
): [get: Accessor<string>, set: Setter<string>, clear: () => void] => {
  const [get, set] = createSignal(fallback);
  const clear = () => set(fallback);

  return [get, set, clear] as const;
};
