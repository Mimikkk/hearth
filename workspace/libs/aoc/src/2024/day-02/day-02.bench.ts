import { createPuzzleBench } from "../../utils/create-puzzle-bench.ts";
import puzzle from "./day-02.ts";

const isSafe = (values: number[]) => {
  const isIncreasing = values[0] < values[1];
  if (values[0] === values[1]) return false;

  return Iterator.from(values).drop(1).every((val, i) => {
    const r = isIncreasing ? val - values[i] : values[i] - val;
    return r === 1 || r === 2 || r === 3;
  });
};

const countSafe = (lists: number[][]) => lists.reduce((count, list) => +isSafe(list) + count, 0);

const countSemiSafe = (lists: number[][]) =>
  lists.reduce((count, list) => {
    if (isSafe(list)) return count + 1;

    return Iterator.from(list)
        .map((_, skip) => list.filter((_, i) => i !== skip))
        .some(isSafe)
      ? count + 1
      : count;
  }, 0);

await createPuzzleBench({
  baseline: puzzle,
  implementations: [puzzle.with({
    easy: countSafe,
    hard: countSemiSafe,
  })],
  testEasy: true,
  testHard: true,
  realEasy: true,
  realHard: true,
});
