import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";

const codeOf = (code: string) => code.charCodeAt(0);
const isUppercase = (code: string) => code >= "A" && code <= "Z";
const isLowercase = (code: string) => code >= "a" && code <= "z";

export const priorityOf = (item: string): number => {
  if (isUppercase(item)) return codeOf(item) - 38;
  if (isLowercase(item)) return codeOf(item) - 96;
  throw Error(`Invalid item: '${item}'`);
};

const findCommonItemInParts = (rucksack: string): string | undefined => {
  const middleIndex = ~~((rucksack.length) / 2);

  for (let i = 0; i < middleIndex; ++i) {
    const first = rucksack[i];

    for (let j = middleIndex; j < rucksack.length; ++j) {
      if (first === rucksack[j]) return first;
    }
  }

  return undefined;
};

const findCommonItemInGroup = (group: string[]): string | undefined => {
  const first = group[0];

  for (let i = 0; i < first.length; ++i) {
    const item = first[i];

    let inAll = true;
    for (let k = 1; k < group.length; ++k) {
      let inCurrent = false;

      for (let j = 0; j < group[k].length; ++j) {
        if (item === group[k][j]) {
          inCurrent = true;
          break;
        }
      }

      if (!inCurrent) {
        inAll = false;
        break;
      }
    }

    if (inAll) return item;
  }

  return undefined;
};

export default Puzzle.create({
  prepare: Str.lines,
  easy(rucksacks) {
    let total = 0;
    for (const rucksack of rucksacks) {
      const element = findCommonItemInParts(rucksack);
      if (!element) continue;

      total += priorityOf(element);
    }

    return total;
  },
  hard(rucksacks) {
    const groupSize = 3;

    let total = 0;
    for (let i = 0; i < rucksacks.length; i += groupSize) {
      const element = findCommonItemInGroup(rucksacks.slice(i, i + groupSize));
      if (!element) continue;

      total += priorityOf(element);
    }

    return total;
  },
});
