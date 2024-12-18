import { AssertionError } from "jsr:@std/assert/assertion-error";
import { expect } from "jsr:@std/expect/expect";
import { describe, it } from "jsr:@std/testing/bdd";
import type { Puzzle } from "../types/puzzle.ts";
import { Result } from "../types/result.ts";
import { Files } from "./files.ts";
import { type InputType, urlOf } from "./url-of.ts";

interface PuzzleTestOptions<P extends Puzzle<any, any, any, any, any>> {
  puzzle: P;
  easyTest?: Awaited<ReturnType<P["easy"]>>;
  hardTest?: Awaited<ReturnType<P["hard"]>>;
  easyUser?: Awaited<ReturnType<P["easy"]>>;
  hardUser?: Awaited<ReturnType<P["hard"]>>;
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

const dayAndYearFromCallStack = () => {
  const trace = Error().stack;

  const callerLine = trace?.split("\n").at(-1);
  let match = callerLine?.match(/at file:\/\/(.+\.ts)/);
  if (!match) throw Error("Invalid path");

  const filePath = match[1];
  match = filePath.match(/\/(\d{4})\/day-(\d{2})\//);
  if (!match) throw Error(`Invalid path: ${filePath}`);

  const year = +match[1];
  const day = +match[2];
  return { year, day };
};

export const createPuzzleTest = <P extends Puzzle<any, any, any, any, any>>(
  {
    puzzle,
    easyTest,
    hardTest,
    easyUser,
    hardUser,
    easyTestInput = "type:input-test",
    hardTestInput = "type:input-test",
    easyUserInput = "type:input-user",
    hardUserInput = "type:input-user",
  }: PuzzleTestOptions<P>,
): void => {
  const { year, day } = dayAndYearFromCallStack();

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
        const result = await puzzle.easy(content);
        tryStacklessAssert(() => expect(result).toEqual(easyTest));
      });
    }

    if (hardTest !== undefined && puzzle.configuration.hard) {
      it("hard - test", async () => {
        const content = await readContent(hardTestInput);
        const result = await puzzle.hard(content);
        tryStacklessAssert(() => expect(result).toEqual(hardTest));
      });
    }

    if (easyUser !== undefined && puzzle.configuration.easy) {
      it("easy - real", async () => {
        const content = await readContent(easyUserInput);
        const result = await puzzle.easy(content);
        tryStacklessAssert(() => expect(result).toEqual(easyUser));
      });
    }

    if (hardUser !== undefined && puzzle.configuration.hard) {
      it("hard - real", async () => {
        const content = await readContent(hardUserInput);
        const result = await puzzle.hard(content);
        tryStacklessAssert(() => expect(result).toEqual(hardUser));
      });
    }
  });
};
