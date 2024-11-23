import { expect } from "jsr:@std/expect";
import { describe, it } from "jsr:@std/testing/bdd";
import { easy, hard } from "./day-01.ts";

describe("Library - aoc2022", () => {
  it("day1", () => {
    expect(easy()).toBe(71506);
    expect(hard()).toBe(209603);
  });
});
