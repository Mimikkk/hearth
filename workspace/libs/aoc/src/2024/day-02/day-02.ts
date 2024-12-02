import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";

const parseLists = (content: string): number[][] => Str.lines(content).map((line) => line.split(" ").map(Number));

const isSafe = (values: number[]) => {
  if (values[0] > values[1]) {
    for (let i = 1; i < values.length; ++i) {
      const difference = values[i - 1] - values[i];
      if (difference !== 3 && difference !== 2 && difference !== 1) return false;
    }
    return true;
  }
  if (values[0] < values[1]) {
    for (let i = 1; i < values.length; ++i) {
      const difference = values[i] - values[i - 1];
      if (difference !== 3 && difference !== 2 && difference !== 1) return false;
    }
    return true;
  }
  return false;
};

const countSafe = (lists: number[][]) => {
  let count = 0;
  for (let i = 0; i < lists.length; ++i) {
    const list = lists[i];
    if (isSafe(list)) ++count;
  }

  return count;
};

const countSemiSafe = (lists: number[][]) => {
  let count = 0;
  for (let i = 0; i < lists.length; ++i) {
    const list = lists[i];
    if (isSafe(list)) {
      ++count;
      continue;
    }

    const temp = new Array(list.length - 1);
    for (let skip = 0; skip < list.length; ++skip) {
      for (let j = 0, k = 0; j < list.length; ++j) {
        if (j !== skip) temp[k++] = list[j];
      }
      if (!isSafe(temp)) continue;
      ++count;
      break;
    }
  }
  return count;
};
export default Puzzle.new({
  prepare: parseLists,
  easy: countSafe,
  hard: countSemiSafe,
});
