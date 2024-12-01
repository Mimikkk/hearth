import { createEffectListener } from "./createListener.tsx";

type Modifier = "shift" | "ctrl" | "alt" | "meta";
type Key =
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "g"
  | "h"
  | "i"
  | "j"
  | "k"
  | "l"
  | "m"
  | "n"
  | "o"
  | "p"
  | "q"
  | "r"
  | "s"
  | "t"
  | "u"
  | "v"
  | "w"
  | "x"
  | "y"
  | "z"
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9";

export type KeyCombination =
  | `${Modifier}+${Key}`
  | `${Modifier}+${Modifier}+${Key}`
  | Key;

const parseKey = (key: KeyCombination) => {
  const parts = key.split("+");

  return {
    key: parts[parts.length - 1],
    shift: parts.includes("shift"),
    ctrl: parts.includes("ctrl"),
    alt: parts.includes("alt"),
    meta: parts.includes("meta"),
  };
};

export const createKeyboardShortcut = (key: KeyCombination, fn: () => void) => {
  const { key: targetKey, shift, ctrl, alt, meta } = parseKey(key);

  return createEffectListener("keydown", (event) => {
    if (
      event.key.toLowerCase() === targetKey &&
      event.shiftKey === shift &&
      event.ctrlKey === ctrl &&
      event.altKey === alt &&
      event.metaKey === meta
    ) {
      fn();
    }
  });
};
