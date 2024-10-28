import { createKeyboardShortcut } from "../../../shared/createKeyboardShorcut.tsx";
import { createStorageSignal } from "../../../shared/createStorageSignal.tsx";
import { createContext } from "../../../shared/logic/createContext.tsx";

interface UseDevTools {
  key: string;
}

export const [useDevTools, DevToolsProvider] = createContext((props: UseDevTools) => {
  const [active, set] = createStorageSignal({ key: props.key, initial: false, empty: false });
  const toggle = () => set(!active());

  createKeyboardShortcut("alt+ctrl+d", toggle);

  return { active, toggle, set };
});
