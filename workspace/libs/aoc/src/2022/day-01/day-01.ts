import { Result } from "../../types/result.ts";
import { Files } from "../../utils/files.ts";
import { sum } from "../../utils/math.ts";
import { Str } from "../../utils/text.ts";
import { Urls } from "../urls.ts";

export const easy = () =>
  Result.amap(Files.lines(Urls[1].easy.real), (lines) => top1(lines.map((line) => line === "" ? null : +line)));

export const hard = () =>
  Result.amap(Files.lines(Urls[1].hard.real), (lines) => topN(lines.map((line) => line === "" ? null : +line), 3));

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

interface Challenge<R, T1, T2 = T1> {
  prepare?: (value: T1) => T2;
  task: (value: T2) => R;
}

interface Day<T, R1, R2, I1 = T, I2 = T> {
  prepare: (content: string) => T;
  easy: Challenge<R1, T, I1>;
  hard: Challenge<R2, T, I2>;
}

const day = <T, R1, R2, I1 = T, I2 = T>(day: Day<T, R1, R2, I1, I2>): Day<T, R1, R2, I1, I2> => day;

export default day({
  prepare: (text) => Str.lines(text).map((line) => line === "" ? null : +line),
  easy: { task: top1 },
  hard: { task: top3 },
});
