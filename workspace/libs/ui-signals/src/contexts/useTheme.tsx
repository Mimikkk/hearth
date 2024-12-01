import { createMemo, createRenderEffect } from "solid-js";
import { createStorageSignal } from "../signals/createStorageSignal.tsx";
import { createContext } from "./createContext.tsx";

const createTheme = (key: string) => {
  const system = globalThis.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const [get, set] = createStorageSignal<undefined | "dark" | "light">({ key });

  createRenderEffect(() => {
    const list = document.documentElement.classList;
    const theme = get() ?? system;

    list.remove(theme === "dark" ? "light" : "dark");
    list.add(theme);
  });

  const next = createMemo(() => {
    const theme = get();

    if (system === "dark") {
      if (theme === undefined) {
        return "light";
      } else if (theme === "light") {
        return "dark";
      } else if (theme === "dark") {
        return undefined;
      }
    } else {
      if (theme === undefined) {
        return "dark";
      } else if (theme === "dark") {
        return "light";
      } else if (theme === "light") {
        return undefined;
      }
    }
  });

  const mode = createMemo(() => get() ?? system);
  const toggle = () => set(next());

  return { get, mode, system, set, next, toggle };
};

export interface UseTheme {
  key: string;
}
export const [useTheme, ThemeProvider] = createContext((props: UseTheme) => createTheme(props.key));
