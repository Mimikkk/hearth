import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";

type Range = [from: number, to: number];
const hasFullOverlap = ([aFrom, aTo]: Range, [bFrom, bTo]: Range) => {
  if (aFrom <= bFrom && aTo >= bTo) return true;
  if (bFrom <= aFrom && bTo >= aTo) return true;
  return false;
};

const hasAnyOverlap = ([aFrom, aTo]: Range, [bFrom, bTo]: Range) => {
  if (aFrom <= bFrom && aTo >= bFrom) return true;
  if (bFrom <= aFrom && bTo >= aFrom) return true;
  return false;
};

const countBy = <T>(items: T[], predicate: (item: T) => boolean): number => {
  let count = 0;
  for (let i = 0; i < items.length; ++i) {
    if (!predicate(items[i])) continue;
    count += 1;
  }
  return count;
};

export default Puzzle.new({
  prepare: (content) =>
    Str.lines(content).map((s) => s.split(",").map((s) => s.split("-").map(Number))) as [Range, Range][],
  easy: (ranges) => countBy(ranges, ([a, b]) => hasFullOverlap(a, b)),
  hard: (ranges) => countBy(ranges, ([a, b]) => hasAnyOverlap(a, b)),
});
