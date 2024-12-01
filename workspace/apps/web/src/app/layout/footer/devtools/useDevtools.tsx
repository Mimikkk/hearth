import { createContext, createKeyboardShortcut, createStorageSignal } from "@mimi/ui-signals";

interface UseDevTools {
  key: string;
}

export const [useDevTools, DevToolsProvider] = createContext((props: UseDevTools) => {
  const [active, set] = createStorageSignal({ key: props.key, initial: false, empty: false });
  const toggle = () => set(!active());

  createKeyboardShortcut("alt+ctrl+d", toggle);

  return { active, toggle, set };
});
