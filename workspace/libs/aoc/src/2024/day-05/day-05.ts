import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";

interface Pages {
  rules: Map<number, number[]>;
  lists: number[][];
}

const prepareConnections = (content: string): Pages => {
  const lines = Str.lines(content);

  const rulesLines: string[] = [];
  let i = 0;

  while (lines[i]) rulesLines.push(lines[i++]);
  ++i;

  const listsLines: string[] = [];
  while (lines[i]) listsLines.push(lines[i++]);

  const rules = new Map();
  for (let i = 0; i < rulesLines.length; ++i) {
    const [after, before] = rulesLines[i].split("|").map(Number) as [number, number];

    let list = rules.get(before);
    if (list === undefined) {
      list = [];
      rules.set(before, list);
    }

    list.push(after);
  }

  const lists = listsLines.map((line) => line.split(",").map(Number));

  return { rules, lists };
};

const isCorrect = (list: number[], rules: Map<number, number[]>): boolean => {
  for (let i = 0; i < list.length; ++i) {
    const ruling = rules.get(list[i]);
    if (ruling === undefined) continue;

    for (let j = i + 1; j < list.length; ++j) {
      const value = list[j];

      if (ruling.includes(value)) return false;
    }
  }

  return true;
};

const sumCorrectMiddlePageNumbers = ({ rules, lists }: Pages) => {
  let sum = 0;
  for (let i = 0; i < lists.length; ++i) {
    const list = lists[i];
    if (isCorrect(list, rules)) {
      sum += list[~~(list.length / 2)];
    }
  }
  return sum;
};

const sortByRules = (list: number[], rules: Map<number, number[]>): number[] =>
  list.sort((a, b) => rules.get(a)?.includes(b) ? -1 : 1);

const sumFixedIncorrentMiddlePageNumbers = ({ rules, lists }: Pages) => {
  let sum = 0;
  for (let i = 0; i < lists.length; ++i) {
    const list = lists[i];
    if (isCorrect(list, rules)) continue;

    sortByRules(list, rules);
    sum += list[~~(list.length / 2)];
  }
  return sum;
};

export default Puzzle.new({
  prepare: prepareConnections,
  easy: sumCorrectMiddlePageNumbers,
  hard: sumFixedIncorrentMiddlePageNumbers,
});
