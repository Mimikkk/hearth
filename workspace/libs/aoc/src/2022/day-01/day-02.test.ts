import { expect } from "jsr:@std/expect";
import { describe, it } from "jsr:@std/testing/bdd";
import { Result } from "../../mod.ts";
import { Files } from "../../utils/files.ts";
import { Urls } from "../urls.ts";
import puzzle from "./day-02.ts";

describe("Library - aoc2022 - day02", () => {
  it("easy - test", async () => {
    const content = Result.val(await Files.text(Urls.day02.easy.test))!;

    expect(puzzle.easy(content)).toEqual(15);
  });

  it("easy - real", async () => {
    const content = Result.val(await Files.text(Urls.day02.easy.real))!;

    expect(puzzle.easy(content)).toEqual(13052);
  });

  it("hard - test", async () => {
    const content = Result.val(await Files.text(Urls.day02.hard.test))!;

    expect(puzzle.hard(content)).toEqual(12);
  });

  it("hard - real", async () => {
    const content = Result.val(await Files.text(Urls.day02.hard.real))!;

    expect(puzzle.hard(content)).toEqual(13693);
  });
});
