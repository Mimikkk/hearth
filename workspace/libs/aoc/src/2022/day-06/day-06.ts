import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";

const findFirst4UniqueString = (code: string): number | null => {
  const len = code.length;

  for (let i = 0; i < len - 3; ++i) {
    const a = code[i];
    const b = code[i + 1];
    if (a === b) continue;
    const c = code[i + 2];
    if (a === c || b === c) continue;
    const d = code[i + 3];
    if (a === d || b === d || c === d) continue;
    return i + 4;
  }

  return null;
};

const findFirstNUniqueString = (code: string, n: number): number | null => {
  const len = code.length;

  const str: string[] = [];
  for (let i = 0; i < len; ++i) {
    const value = code[i];
    const sameAt = str.findIndex((v) => v === value);
    str.push(value);
    if (sameAt !== -1) str.splice(0, sameAt + 1);

    if (str.length === n) return i + 1;
  }

  return null;
};

const findFirst14UniqueString = (code: string): number | null => findFirstNUniqueString(code, 14);

export default Puzzle.create({
  prepare: Str.trim,
  easy: findFirst4UniqueString,
  hard: findFirst14UniqueString,
});
