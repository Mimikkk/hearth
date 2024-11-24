import { expect } from "jsr:@std/expect/expect";
import { describe, it } from "jsr:@std/testing/bdd";
import { urlOf } from "./url-of.ts";

describe("Library - aoc2022 - urlOf", () => {
  it("urlOf", () => {
    expect(urlOf(2022, 1, "test", "easy")).toEqual(new URL("../2022/resources/day-01/test-easy.txt", import.meta.url));
  });
});
