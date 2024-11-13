import { expect } from "jsr:@std/expect";
import { describe, it } from "jsr:@std/testing/bdd";
import { day01 } from "./day-01.ts";

describe("Library - aoc2022", () => {
  it("day1", () => {
    expect(day01()).toBe("aoc2022");
  });
});
