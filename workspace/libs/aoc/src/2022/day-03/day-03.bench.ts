import { Puzzle, Str } from "../../mod.ts";
import { createPuzzleBench } from "../../utils/create-puzzle-bench.ts";
import puzzle, { priorityOf } from "./day-03.ts";

const boomerloop = Puzzle.new({
  prepare: Str.lines,
  easy(rucksacks) {
    let total = 0;
    outer: for (let i = 0; i < rucksacks.length; ++i) {
      const rucksack = rucksacks[i];

      const middleIndex = ~~((rucksack.length) / 2);

      for (let j = 0; j < middleIndex; ++j) {
        const first = rucksack[j];

        for (let k = middleIndex; k < rucksack.length; ++k) {
          if (first === rucksack[k]) {
            total += priorityOf(first);
            continue outer;
          }
        }
      }

      throw Error(`Invalid rucksack: '${rucksack}'`);
    }

    return total;
  },
  hard(rucksacks) {
    const groupSize = 3;

    let total = 0;
    for (let i = 0; i < rucksacks.length; i += groupSize) {
      const group = rucksacks.slice(i, i + groupSize);

      total += priorityOf(findCommonItem(group)!);
    }
    return total;
  },
});

const findCommonItem = (group: string[]): string | undefined => {
  const first = group[0];

  for (let i = 0; i < first.length; ++i) {
    const char = first[i];

    let foundInAll = true;
    for (let k = 1; k < group.length; ++k) {
      let foundInCurrent = false;
      for (let j = 0; j < group[k].length; ++j) {
        if (char === group[k][j]) {
          foundInCurrent = true;
          break;
        }
      }
      if (!foundInCurrent) {
        foundInAll = false;
        break;
      }
    }

    if (foundInAll) return char;
  }

  return undefined;
};

await createPuzzleBench({
  year: 2022,
  day: 3,
  baseline: puzzle,
  implementations: [boomerloop],
  testEasy: true,
  testHard: true,
  realEasy: true,
  realHard: true,
});
