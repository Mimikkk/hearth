import { expect } from "jsr:@std/expect";
import { describe, it } from "jsr:@std/testing/bdd";
import { Result } from "../../mod.ts";
import { Files } from "../../utils/files.ts";
import { Urls } from "../urls.ts";
import puzzle from "./day-01.ts";

describe("Library - aoc2022", () => {
  it("day1", async () => {
    const content = Result.val(await Files.text(Urls.day01.easy.test))!;

    expect(puzzle.easy(content)).toEqual(24000);
    expect(puzzle.hard(content)).toEqual(45000);
  });
});
