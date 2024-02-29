import { Accessor, createSignal, Setter } from 'solid-js';

export const createToggle = (
  initial: boolean = false,
): [get: Accessor<boolean>, set: Setter<boolean>, toggle: () => void] => {
  const [get, set] = createSignal(initial);

  const toggle = () => set(!get());

  return [get, set, toggle] as const;
};
