import { AssertionError } from "jsr:@std/assert/assertion-error";
import { expect } from "jsr:@std/expect/expect";
import { describe, it } from "jsr:@std/testing/bdd";
import type { Puzzle } from "../types/puzzle.ts";
import { Result } from "../types/result.ts";
import { Files } from "./files.ts";
import { type InputType, urlOf } from "./url-of.ts";

interface PuzzleOptions<P extends Puzzle<any, any, any, any, any>> {
  year: number;
  day: number;
  puzzle: P;
  easyTest?: ReturnType<P["easy"]>;
  hardTest?: ReturnType<P["hard"]>;
  easyUser?: ReturnType<P["easy"]>;
  hardUser?: ReturnType<P["hard"]>;
  easyTestInput?: `type:${InputType}` | string;
  hardTestInput?: `type:${InputType}` | string;
  easyUserInput?: `type:${InputType}` | string;
  hardUserInput?: `type:${InputType}` | string;
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
  {
    year,
    day,
    puzzle,
    easyTest,
    hardTest,
    easyUser,
    hardUser,
    easyTestInput = "type:input-test",
    hardTestInput = "type:input-test",
    easyUserInput = "type:input-user",
    hardUserInput = "type:input-user",
  }: PuzzleOptions<P>,
): void => {
  const dayStr = day.toString().padStart(2, "0");
  const readContent = async (input: string): Promise<string> => {
    if (!input.startsWith("type:")) return input;

    const type = input.slice(5);
    return Result.val(await Files.text(urlOf(year, day, type as InputType)))!;
  };

  describe(`Library - aoc - year ${year} - day ${dayStr}`, () => {
    if (easyTest !== undefined && puzzle.configuration.easy) {
      it("easy - test", async () => {
        const content = await readContent(easyTestInput);

        tryStacklessAssert(() => expect(puzzle.easy(content)).toEqual(easyTest));
      });
    }

    if (hardTest !== undefined && puzzle.configuration.hard) {
      it("hard - test", async () => {
        const content = await readContent(hardTestInput);

        tryStacklessAssert(() => expect(puzzle.hard(content)).toEqual(hardTest));
      });
    }

    if (easyUser !== undefined && puzzle.configuration.easy) {
      it("easy - real", async () => {
        const content = await readContent(easyUserInput);

        tryStacklessAssert(() => expect(puzzle.easy(content)).toEqual(easyUser));
      });
    }

    if (hardUser !== undefined && puzzle.configuration.hard) {
      it("hard - real", async () => {
        const content = await readContent(hardUserInput);

        tryStacklessAssert(() => expect(puzzle.hard(content)).toEqual(hardUser));
      });
    }
  });
};
