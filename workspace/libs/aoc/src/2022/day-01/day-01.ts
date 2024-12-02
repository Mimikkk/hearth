import { Puzzle } from "../../types/puzzle.ts";
import { sum } from "../../utils/maths.ts";
import { Str } from "../../utils/strs.ts";

const top1 = (values: (number | null)[]): number => {
  let max = 0;
  iterateSums(values, (sum) => {
    if (sum > max) max = sum;
  });
  return max;
};
const topN = (values: (number | null)[], n: number): number => {
  const top = Array(n).fill(0);
  iterateSums(values, (sum) => {
    let i = 0;
    while (i < n && top[i] > sum) i++;

    if (i >= n) return;

    for (let j = n - 1; j > i; j--) {
      top[j] = top[j - 1];
    }
    top[i] = sum;
  });
  return sum(top);
};
const top3 = (values: (number | null)[]): number => topN(values, 3);

const iterateSums = (values: (number | null)[], onSum: (total: number) => void) => {
  let sum = 0;
  for (let i = 0; i < values.length; ++i) {
    const value = values[i];

    if (value === null) {
      onSum(sum);
      sum = 0;
    } else {
      sum += value;
    }
  }
  onSum(sum);
};

export default Puzzle.new({
  prepare: (text) => Str.lines(text).map((line) => line === "" ? null : +line),
  easy: top1,
  hard: top3,
});
