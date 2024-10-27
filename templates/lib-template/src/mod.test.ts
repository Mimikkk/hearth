import { expect } from "jsr:@std/expect";
import { describe, it } from "jsr:@std/testing/bdd";
import { foo } from "./mod.ts";

describe("Library - lib-a", () => {
  it("foo", () => {
    expect(foo()).toBe("foo");
  });
});
