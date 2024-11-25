import { colors } from "jsr:@cliffy/ansi@1.0.0-rc.7/colors";
import { Command } from "jsr:@cliffy/command@1.0.0-rc.7";
import { Number } from "jsr:@cliffy/prompt@1.0.0-rc.7";

const formatDay = (day: number) => day.toString().padStart(2, "0");

const puzzleTemplate = `
import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";

export default Puzzle.create({
  prepare: () => Str.lines,
  easy: () => 0,
  hard: () => 0,
});
`;

const testTemplate = (year: number, day: number) => `
import { createPuzzleTest } from "../../utils/create-puzzle-test.ts";
import puzzle from "./day-${formatDay(day)}.ts";

createPuzzleTest({
  year: ${year},
  day: ${day},
  puzzle,
});
`;

const benchTemplate = (year: number, day: number) => `
import { createPuzzleBench } from "../../utils/create-puzzle-bench.ts";
import puzzle from "./day-${formatDay(day)}.ts";

await createPuzzleBench({
  year: ${year},
  day: ${day},
  baseline: puzzle,
  implementations: [],
  testEasy: true,
  testHard: true,
  realEasy: true,
  realHard: true,
});
`;

const puzzleFileStructure = (year: number, day: number) => [
  [`day-${formatDay(day)}.ts`, puzzleTemplate],
  [`day-${formatDay(day)}.test.ts`, testTemplate(year, day)],
  [`day-${formatDay(day)}.bench.ts`, benchTemplate(year, day)],
];

const puzzleResourceStructure = [
  [`test-user.txt`, ""],
  [`real-user.txt`, ""],
];

namespace Validation {
  const err = (message: string) => {
    console.error(` - ${colors.bold.red("[Validation Error]")} ${message}`);
    return false;
  };

  const validateDay = (day: number): boolean => {
    if (day < 1 || day > 25) {
      err(`${colors.bold.yellow("Day")} must be between ${colors.yellow("1")} and ${colors.yellow("25")}.`);
      return false;
    }

    return true;
  };

  const validateYear = (year: number): boolean => {
    if (year < 2000 || year > 2050) {
      err(`${colors.bold.yellow("Year")} must be between ${colors.yellow("2000")} and ${colors.yellow("2050")}.`);
      return false;
    }

    return true;
  };

  export const validate = (year: number, day: number): boolean => {
    const isValidYear = validateYear(year);
    const isValidDay = validateDay(day);

    return isValidYear && isValidDay;
  };
}

namespace Prompt {
  export const year = async () =>
    await Number.prompt({ message: "Year", hint: "Must be between 2000 and 2050.", min: 2000, max: 2050 });
  export const day = async () =>
    await Number.prompt({ message: "Day", hint: "Must be between 1 and 25.", min: 1, max: 25 });
}

namespace Creator {
  export const files = async (yearDir: string, year: number, day: number) => {
    const dayDir = resolve(yearDir, `day-${formatDay(day)}`);
    await ensureDir(dayDir);
    for (const [path, content] of puzzleFileStructure(year, day)) {
      if (await exists(resolve(dayDir, path))) {
        console.log(` - ${colors.gray("[skip]")} ${colors.yellow(`${path} exists...`)}`);
        continue;
      }
      await Deno.writeTextFile(resolve(dayDir, path), content);
      console.log(` - ${colors.green("[created]")} ${colors.yellow(`${path}`)}`);
    }
  };

  export const resources = async (yearDir: string, day: number) => {
    const resDir = resolve(yearDir, "resources", `day-${formatDay(day)}`);
    await ensureDir(resDir);
    for (const [path, content] of puzzleResourceStructure) {
      if (await exists(resolve(resDir, path))) {
        console.log(` - ${colors.gray("[skip]")} ${colors.yellow(`${path} exists...`)}`);
        continue;
      }
      await Deno.writeTextFile(resolve(resDir, path), content);
      console.log(` - ${colors.green("[created]")} ${colors.yellow(`${path}`)}`);
    }
  };
}

import { ensureDir, exists } from "jsr:@std/fs";
import { resolve } from "jsr:@std/path";
await new Command()
  .name("create-day")
  .description("Create a puzzle for the given year and day.")
  .option("-y, --year <year:number>", "The year of the puzzle to create. Must be between 2000 and 2050.")
  .option("-d, --day <day:number>", "The day of the puzzle to create. Must be between 1 and 25.")
  .action(async ({ year, day }) => {
    if (!year) year = await Prompt.year();
    if (!day) day = await Prompt.day();
    if (!Validation.validate(year, day)) Deno.exit(1);

    const yearDir = resolve(Deno.cwd(), "src", `${year}`);
    console.log(colors.green("Creating puzzle files..."));
    await Creator.files(yearDir, year, day);

    console.log();

    console.log(colors.green("Creating resources..."));
    await Creator.resources(yearDir, day);

    console.log();

    console.log(colors.bold.green("Done!"));
  })
  .parse(Deno.args);
