import { colors } from "jsr:@cliffy/ansi@1.0.0-rc.7/colors";
import { Command } from "jsr:@cliffy/command@1.0.0-rc.7";
import { Number } from "jsr:@cliffy/prompt@1.0.0-rc.7";
import { ensureDir, exists } from "jsr:@std/fs";
import { resolve } from "jsr:@std/path";
import { Result } from "../src/mod.ts";
const formatDay = (day: number) => day.toString().padStart(2, "0");

namespace Validation {
  const Messages = {
    dayError: `- ${colors.bold.red("[Validation Error]")} ${colors.bold.yellow("Day")} must be between ${
      colors.yellow("1")
    } and ${colors.yellow("25")}.`,
    yearError: `- ${colors.bold.red("[Validation Error]")} ${colors.bold.yellow("Year")} must be between ${
      colors.yellow("2000")
    } and ${colors.yellow("2050")}.`,
    sessionError: `- ${colors.bold.red("[Validation Error]")} ${
      colors.bold.yellow("SessionId")
    } must be set within .env file.`,
  };

  const validateDay = (day: number): boolean => day >= 1 && day <= 25;
  const validateYear = (year: number): boolean => year >= 2000 && year <= 2050;
  const validateSession = (session: string): boolean => !!session.length;

  export const validate = (year: number, day: number, session: string): Result<void, string[]> => {
    const errors: string[] = [];

    if (!validateYear(year)) errors.push(Messages.yearError);
    if (!validateDay(day)) errors.push(Messages.dayError);
    if (!validateSession(session)) errors.push(Messages.sessionError);

    return errors.length ? Result.err(errors) : Result.ok(undefined);
  };
}

namespace Prompt {
  export const year = async () =>
    await Number.prompt({ message: "Year", hint: "Must be between 2000 and 2050.", min: 2000, max: 2050 });
  export const day = async () =>
    await Number.prompt({ message: "Day", hint: "Must be between 1 and 25.", min: 1, max: 25 });
}

namespace Creator {
  const Templates = {
    puzzle: `
import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";

export default Puzzle.new({
  prepare: Str.lines,
  easy: () => 0,
  hard: () => 0,
});
`,
    test: (day: number) => `
import { createPuzzleTest } from "../../utils/create-puzzle-test.ts";
import puzzle from "./day-${formatDay(day)}.ts";

createPuzzleTest({
  puzzle,
});
`,
    bench: (day: number) => `
import { createPuzzleBench } from "../../utils/create-puzzle-bench.ts";
import puzzle from "./day-${formatDay(day)}.ts";

await createPuzzleBench({
  baseline: puzzle,
  implementations: [],
  testEasy: true,
  testHard: true,
  realEasy: true,
  realHard: true,
});
`,
  };

  const Messages = {
    skip: (path: string) => ` - ${colors.gray("[skip]")} ${colors.yellow(`${path} exists...`)}`,
    fetching: (path: string) => ` - ${colors.gray("[fetching]")} ${colors.yellow(`${path}`)}...`,
    created: (path: string) => ` - ${colors.green("[created]")} ${colors.yellow(`${path}`)}.`,
  };

  type CreatableFile<T> = {
    path: string;
    content: T;
  };

  const filterFiles = async <T>(files: CreatableFile<T>[], dir: string): Promise<CreatableFile<T>[]> => {
    const filesToCreate: CreatableFile<T>[] = [];

    for (const file of files) {
      const fullPath = resolve(dir, file.path);
      if (await exists(fullPath)) {
        console.info(Messages.skip(file.path));
        continue;
      }
      filesToCreate.push(file);
    }

    return filesToCreate;
  };

  export const createFiles = async (yearDir: string, day: number) => {
    const dayDir = resolve(yearDir, `day-${formatDay(day)}`);
    await ensureDir(dayDir);

    const files: CreatableFile<string>[] = [
      { path: `day-${formatDay(day)}.ts`, content: Templates.puzzle },
      { path: `day-${formatDay(day)}.test.ts`, content: Templates.test(day) },
      { path: `day-${formatDay(day)}.bench.ts`, content: Templates.bench(day) },
    ];

    const filesToCreate = await filterFiles(files, dayDir);

    for (const file of filesToCreate) {
      await Deno.writeTextFile(resolve(dayDir, file.path), file.content);
      console.info(Messages.created(file.path));
    }
  };

  export const createResources = async (yearDir: string, year: number, day: number) => {
    const resDir = resolve(yearDir, "resources", `day-${formatDay(day)}`);
    await ensureDir(resDir);

    const files: CreatableFile<() => Promise<Result<string, string>>>[] = [
      { path: "input-test.txt", content: () => Network.fetchInputTest(year, day) },
      { path: "input-user.txt", content: () => Network.fetchInputUser(year, day) },
    ];

    const filesToCreate = await filterFiles(files, resDir);

    for (const file of filesToCreate) {
      console.info(Messages.fetching(file.path));
      const content = await file.content();
      if (!content.ok) {
        console.info(content.error);
        continue;
      }

      await Deno.writeTextFile(resolve(resDir, file.path), content.value);
      console.info(Messages.created(file.path));
    }
  };
}

namespace Network {
  const Messages = {
    noHtml: (year: number, day: number) =>
      ` - ${colors.bold.red("[no-html]")} Failed to fetch puzzle HTML for ${year}/${day}.`,
    noInputTest: (year: number, day: number) =>
      ` - ${colors.bold.red("[no-input-test]")} Failed to find input test for ${year}/${day}.`,
    noInputUser: (year: number, day: number) =>
      ` - ${
        colors.bold.red("[no-input-user]")
      } Failed to fetch input user for ${year}/${day}. Validate whether your Session ID is valid.`,
  };

  export const session = () => Deno.env.has("SESSION_ID") ? Deno.env.get("SESSION_ID")! : "";

  const fetchPuzzleHtml = async (year: number, day: number): Promise<Result<string, string>> => {
    const url = `https://adventofcode.com/${year}/day/${day}`;
    const response = await fetch(url);

    if (!response.ok) return Result.err(Messages.noHtml(year, day));
    return Result.ok(await response.text());
  };

  const findInputTest = (text: string): string | null => {
    const exampleIndex = text.indexOf("example");
    if (exampleIndex === -1) return null;

    const preStart = text.indexOf("<pre><code>", exampleIndex);
    if (preStart === -1) return null;

    const preEnd = text.indexOf("</code></pre>", preStart);
    if (preEnd === -1) return null;

    const source = text.slice(preStart + 11, preEnd);
    return source;
  };

  export const fetchInputTest = async (year: number, day: number): Promise<Result<string, string>> => {
    const html = await fetchPuzzleHtml(year, day);
    if (!html.ok) return html;

    const input = findInputTest(html.value);
    if (!input) return Result.err(Messages.noInputTest(year, day));
    return Result.ok(input);
  };

  export const fetchInputUser = async (year: number, day: number): Promise<Result<string, string>> => {
    const url = `https://adventofcode.com/${year}/day/${day}/input`;
    const response = await fetch(url, { headers: { Cookie: `session=${session()}` } });

    if (!response.ok) return Result.err(Messages.noInputUser(year, day));
    return Result.ok(await response.text());
  };
}

await new Command()
  .name("create-day")
  .description("Create a puzzle for the given year and day.")
  .option("-y, --year <year:number>", "The year of the puzzle to create. Must be between 2000 and 2050.")
  .option("-d, --day <day:number>", "The day of the puzzle to create. Must be between 1 and 25.")
  .action(async ({ year, day }) => {
    if (!year) year = await Prompt.year();
    if (!day) day = await Prompt.day();
    const validation = Validation.validate(year, day, Network.session());
    if (!validation.ok) {
      console.info(validation.error.join("\n"));
      Deno.exit(1);
    }

    const yearDir = resolve(Deno.cwd(), "src", `${year}`);

    console.info(colors.green("Creating puzzle files..."));
    await Creator.createFiles(yearDir, day);

    console.info();

    console.info(colors.green("Creating resources..."));
    await Creator.createResources(yearDir, year, day);

    console.info(colors.bold.green("Done!"));
  })
  .parse(Deno.args);
