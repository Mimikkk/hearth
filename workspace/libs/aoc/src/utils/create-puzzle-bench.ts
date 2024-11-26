import type { Puzzle } from "../types/puzzle.ts";
import { Result } from "../types/result.ts";
import { Files } from "./files.ts";
import { type Difficulty, type InputType, urlOf } from "./url-of.ts";

export const createPuzzleBench = async <P extends Puzzle<any, any, any, any, any>>(
  { year, day, baseline, implementations, testEasy, realEasy, testHard, realHard }: {
    year: number;
    day: number;
    baseline: P;
    implementations: P[];
    testEasy?: boolean;
    realEasy?: boolean;
    testHard?: boolean;
    realHard?: boolean;
  },
) => {
  const dayStr = day.toString().padStart(2, "0");

  const benches = async (type: InputType, difficulty: Difficulty) => {
    const content = Result.val(await Files.text(urlOf(year, day, type)))!;

    const group = `year ${year} - day ${dayStr} - ${type} - ${difficulty}`;
    Deno.bench({ group, name: "baseline", fn: () => baseline[difficulty](content), baseline: true });

    for (let i = 0; i < implementations.length; i++) {
      const implementation = implementations[i];
      if (!implementation.configuration[difficulty]) continue;

      Deno.bench({ group, name: `implementation ${i}`, fn: () => implementation[difficulty](content) });
    }
  };

  if (testEasy) await benches("input-test", "easy");
  if (realEasy) await benches("input-user", "easy");
  if (testHard) await benches("input-test", "hard");
  if (realHard) await benches("input-user", "hard");
};
