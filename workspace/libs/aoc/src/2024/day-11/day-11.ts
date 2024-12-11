import { Puzzle } from "../../types/puzzle.ts";
import { Counter } from "../../utils/datatypes/counter.ts";
import { Str } from "../../utils/strs.ts";

const parseStones = (content: string): string[] => content.split(" ");

const stoneCountAfterNBlinks = (stones: string[], rounds: number) => {
  let counter = Counter.fromArray(stones);

  for (let round = 0; round < rounds; ++round) {
    const next = Counter.new<string>();

    for (const [stone, count] of counter.entries()) {
      if (stone === "0") {
        next.add("1", count);
      } else if (stone.length % 2 === 0) {
        const half = stone.length / 2;
        const left = Str.trimStart(stone.substring(0, half), "0");
        const right = Str.trimStart(stone.substring(half), "0");

        next.add(left, count);
        next.add(right, count);
      } else {
        const key = (BigInt(stone) * 2024n).toString();
        next.add(key, count);
      }
    }

    counter = next;
  }

  return counter.count();
};

export default Puzzle.new({
  prepare: parseStones,
  easy: (stones) => stoneCountAfterNBlinks(stones, 25),
  hard: (stones) => stoneCountAfterNBlinks(stones, 75),
});
