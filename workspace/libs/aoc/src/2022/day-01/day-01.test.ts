import { expect } from "jsr:@std/expect";
import { describe, it } from "jsr:@std/testing/bdd";
import type { Ok } from "../../types/result.ts";
import { Files } from "../../utils/files.ts";
import { Urls } from "../urls.ts";
import puzzle from "./day-01.ts";

describe("Library - aoc2022", () => {
  it("day1", async () => {
    const { value: content } = (await Files.text(Urls[1].easy.test)) as Ok<string>;

    expect(puzzle.easy(content)).toEqual(24000);
    expect(puzzle.hard(content)).toEqual(45000);
  });
});
