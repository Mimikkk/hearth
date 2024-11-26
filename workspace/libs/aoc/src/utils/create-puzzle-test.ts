import { AssertionError } from "jsr:@std/assert/assertion-error";
import { expect } from "jsr:@std/expect/expect";
import { describe, it } from "jsr:@std/testing/bdd";
import type { Puzzle } from "../types/puzzle.ts";
import { Result } from "../types/result.ts";
import { Files } from "./files.ts";
import { urlOf } from "./url-of.ts";

interface PuzzleOptions<P extends Puzzle<any, any, any, any, any>> {
  year: number;
  day: number;
  puzzle: P;
  easyTest?: ReturnType<P["easy"]>;
  hardTest?: ReturnType<P["hard"]>;
  realEasy?: ReturnType<P["easy"]>;
  realHard?: ReturnType<P["hard"]>;
}

const tryStacklessAssert = (callback: () => void) => {
  try {
    callback();
  } catch (error: unknown) {
    if (error instanceof AssertionError) error.stack = undefined;
    throw error;
  }
};

export const createPuzzleTest = <P extends Puzzle<any, any, any, any, any>>(
  { year, day, puzzle, easyTest, hardTest, realEasy, realHard }: PuzzleOptions<P>,
): void => {
  const dayStr = day.toString().padStart(2, "0");
  describe(`Library - aoc - year ${year} - day ${dayStr}`, () => {
    if (easyTest !== undefined && puzzle.configuration.easy) {
      it("easy - test", async () => {
        const content = Result.val(await Files.text(urlOf(year, day, "input-test")))!;

        tryStacklessAssert(() => expect(puzzle.easy(content)).toEqual(easyTest));
      });
    }

    if (hardTest !== undefined && puzzle.configuration.hard) {
      it("hard - test", async () => {
        const content = Result.val(await Files.text(urlOf(year, day, "input-test")))!;

        tryStacklessAssert(() => expect(puzzle.hard(content)).toEqual(hardTest));
      });
    }

    if (realEasy !== undefined && puzzle.configuration.easy) {
      it("easy - real", async () => {
        const content = Result.val(await Files.text(urlOf(year, day, "input-user")))!;

        tryStacklessAssert(() => expect(puzzle.easy(content)).toEqual(realEasy));
      });
    }

    if (realHard !== undefined && puzzle.configuration.hard) {
      it("hard - real", async () => {
        const content = Result.val(await Files.text(urlOf(year, day, "input-user")))!;

        tryStacklessAssert(() => expect(puzzle.hard(content)).toEqual(realHard));
      });
    }
  });
};
