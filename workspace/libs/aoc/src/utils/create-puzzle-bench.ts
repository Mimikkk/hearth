import type { Puzzle } from "../types/puzzle.ts";
import { Result } from "../types/result.ts";
import { Files } from "./files.ts";
import { type Difficulty, type InputType, urlOf } from "./url-of.ts";

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

interface PuzzleBenchOptions<P extends Puzzle<any, any, any, any, any>> {
  baseline: P;
  implementations: P[];
  testEasy?: boolean;
  testEasyInput?: `type:${InputType}` | string;
  realEasy?: boolean;
  realEasyInput?: `type:${InputType}` | string;
  testHard?: boolean;
  testHardInput?: `type:${InputType}` | string;
  realHard?: boolean;
  realHardInput?: `type:${InputType}` | string;
}

export const createPuzzleBench = async <P extends Puzzle<any, any, any, any, any>>(
  {
    baseline,
    implementations,
    testEasy,
    realEasy,
    testHard,
    realHard,
    testEasyInput = "input-test",
    realEasyInput = "input-user",
    testHardInput = "input-test",
    realHardInput = "input-user",
  }: PuzzleBenchOptions<P>,
) => {
  const { year, day } = dayAndYearFromCallStack();
  const dayStr = day.toString().padStart(2, "0");
  const readContent = async (input: string): Promise<string> => {
    if (!input.startsWith("type:")) return input;

    const type = input.slice(5);
    return Result.val(await Files.text(urlOf(year, day, type as InputType)))!;
  };

  const benches = async (type: `type:${InputType}` | string, difficulty: Difficulty) => {
    const content = await readContent(type);

    const group = `Library - aoc - year ${year} - day ${dayStr} - ${type} - ${difficulty}`;
    Deno.bench({
      group,
      name: `year ${year} - day ${dayStr} - ${type} - ${difficulty} - baseline`,
      fn: () => baseline[difficulty](content),
      baseline: true,
    });

    for (let i = 0; i < implementations.length; i++) {
      const implementation = implementations[i];
      if (!implementation.configuration[difficulty]) continue;

      const expected = baseline[difficulty](content);
      const actual = implementation[difficulty](content);
      const bothCorrect = expected === actual;
      if (!bothCorrect) {
        throw new Error(`Implementation ${i} is invalid. Expected ${expected} but got ${actual}.`);
      }

      Deno.bench({
        group,
        name: `year ${year} - day ${dayStr} - ${type} - ${difficulty} - implementation ${i}`,
        fn: () => implementation[difficulty](content),
      });
    }
  };

  if (testEasy) await benches(testEasyInput, "easy");
  if (realEasy) await benches(realEasyInput, "easy");
  if (testHard) await benches(testHardInput, "hard");
  if (realHard) await benches(realHardInput, "hard");
};
