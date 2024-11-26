import { Puzzle } from "../../types/puzzle.ts";
import { createPuzzleBench } from "../../utils/create-puzzle-bench.ts";
import { Str } from "../../utils/strs.ts";
import puzzle from "./day-06.ts";

const stackless = Puzzle.create({
  prepare: Str.trim,
  hard(code) {
    const n = 14;
    const len = code.length;

    let startIndex = 0;
    let endIndex = 0;
    const findSameAt = (startAt: number, endAt: number, value: string): number | null => {
      for (let i = startAt; i < endAt; ++i) {
        if (code[i] === value) return i;
      }

      return null;
    };

    while (endIndex < len) {
      const value = code[endIndex];
      const sameAt = findSameAt(startIndex, endIndex, value);
      if (sameAt !== null) startIndex = sameAt + 1;

      ++endIndex;
      if (endIndex - startIndex === n) return endIndex;
    }

    return null;
  },
});

await createPuzzleBench({
  year: 2022,
  day: 6,
  baseline: puzzle,
  implementations: [stackless],
  // testEasy: true,
  testHard: true,
  // realEasy: true,
  // realHard: true,
});
