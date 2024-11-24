import { expect } from "jsr:@std/expect/expect";
import { describe, it } from "jsr:@std/testing/bdd";
import type { Puzzle } from "../types/puzzle.ts";
import { Result } from "../types/result.ts";
import { Files } from "./files.ts";
import { urlOf } from "./url-of.ts";

export const createPuzzleTest = <P extends Puzzle<any, any, any, any, any>>(
  {
    year,
    day,
    puzzle,
    easyTest,
    hardTest,
    realEasy,
    realHard,
  }: {
    year: number;
    day: number;
    puzzle: P;
    easyTest?: ReturnType<P["easy"]>;
    hardTest?: ReturnType<P["hard"]>;
    realEasy?: ReturnType<P["easy"]>;
    realHard?: ReturnType<P["hard"]>;
  },
) => {
  const dayStr = day.toString().padStart(2, "0");
  describe(`Library - aoc2022 - day${dayStr}`, () => {
    if (easyTest !== undefined) {
      it("easy - test", async () => {
        const content = Result.val(await Files.text(urlOf(year, day, "test", "easy")))!;

        expect(puzzle.easy(content)).toEqual(easyTest);
      });
    }

    if (hardTest !== undefined) {
      it("hard - test", async () => {
        const content = Result.val(await Files.text(urlOf(year, day, "test", "hard")))!;

        expect(puzzle.hard(content)).toEqual(hardTest);
      });
    }

    if (realEasy !== undefined) {
      it("easy - real", async () => {
        const content = Result.val(await Files.text(urlOf(year, day, "real", "easy")))!;

        expect(puzzle.easy(content)).toEqual(realEasy);
      });
    }

    if (realHard !== undefined) {
      it("hard - real", async () => {
        const content = Result.val(await Files.text(urlOf(year, day, "real", "hard")))!;

        expect(puzzle.hard(content)).toEqual(realHard);
      });
    }
  });
};
