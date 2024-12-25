import { Puzzle } from "../../types/puzzle.ts";
import { Counter } from "../../utils/datatypes/counter.ts";
import { Str } from "../../utils/strs.ts";

const whitespaceRe = /\s+/;
const parseLists = (content: string): [number[], number[]] => {
  const lines = Str.lines(content);
  const a = Array(lines.length);
  const b = Array(lines.length);
  for (let i = 0; i < lines.length; ++i) {
    const [x, y] = lines[i].split(whitespaceRe);
    a[i] = +x;
    b[i] = +y;
  }

  return [a, b] as const;
};

const calculateDistance = ([a, b]: [number[], number[]]) => {
  a.sort();
  b.sort();

  let distance = 0;
  for (let i = 0; i < a.length; ++i) {
    distance += Math.abs(a[i] - b[i]);
  }
  return distance;
};

const calculateSimmilarity = ([a, b]: [number[], number[]]) => {
  const counts = Counter.fromArray(b);

  let similarity = 0;
  for (let i = 0; i < a.length; ++i) {
    const value = a[i];
    const count = counts.get(value);
    if (count === undefined) continue;
    similarity += value * count;
  }
  return similarity;
};

export default Puzzle.new({
  prepare: parseLists,
  easy: calculateDistance,
  hard: calculateSimmilarity,
});
