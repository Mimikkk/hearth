import { Puzzle } from "../../types/puzzle.ts";

const isDigit = (char: string) => char >= "0" && char <= "9";
const isComma = (char: string) => char === ",";
const isCloseParen = (char: string) => char === ")";
const isPattern = (content: string, from: number, pattern: string): boolean => {
  for (let i = 0; i < pattern.length; i++) {
    if (content.charAt(from + i) !== pattern.charAt(i)) {
      return false;
    }
  }
  return true;
};

const collectMultiplication = (content: string, from: number): [value: number | null, next: number] => {
  let j = from;
  while (++j && isDigit(content[j]));

  if (!isComma(content[j])) return [null, j];
  let k = j;
  while (++k && isDigit(content[k]));
  if (!isCloseParen(content[k])) return [null, k];

  return [+content.substring(from, j) * +content.substring(j + 1, k), k];
};

const sumMultiplications = (content: string) => {
  let result = 0;

  for (let i = 0; i < content.length; ++i) {
    if (isPattern(content, i, "mul(")) {
      const [value, next] = collectMultiplication(content, i + 4);
      if (value !== null) result += value;
      i = next;
    }
  }

  return result;
};

const sumEnablingMultiplications = (content: string) => {
  let result = 0;
  let enabled = true;

  for (let i = 0; i < content.length; ++i) {
    if (enabled && isPattern(content, i, "mul(")) {
      const [value, next] = collectMultiplication(content, i + 4);
      if (value !== null) result += value;
      i = next;
    } else if (isPattern(content, i, "don't()")) {
      enabled = false;
      i += 6;
    } else if (isPattern(content, i, "do()")) {
      enabled = true;
      i += 3;
    }
  }

  return result;
};

export default Puzzle.new({
  prepare: (content) => content.trim(),
  easy: sumMultiplications,
  hard: sumEnablingMultiplications,
});
