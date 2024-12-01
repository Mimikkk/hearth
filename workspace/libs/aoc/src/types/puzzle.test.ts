import { expect } from "jsr:@std/expect";
import { describe, it } from "jsr:@std/testing/bdd";
import { Puzzle } from "./puzzle.ts";

const puzzle = Puzzle.new({
  prepare: (text) => text + "foo",
  easy: {
    prepare: (value) => value + "bar",
    task: (value) => value + "qux",
  },
  hard: {
    prepare: (value) => value + "baz",
    task: (value) => value + "qux",
  },
});

describe("Puzzle", () => {
  it("easy", () => {
    expect(puzzle.easy("easy-")).toBe("easy-foobarqux");
  });

  it("hard", () => {
    expect(puzzle.hard("hard-")).toBe("hard-foobazqux");
  });
});
