import { expect } from "jsr:@std/expect";
import { describe, it } from "jsr:@std/testing/bdd";

describe("Library - hearth-math - numbers - clamp", () => {
  it("clamps a value between a minimum and maximum", () => {
    expect(clamp(10, 0, 100)).toBe(10);
    expect(clamp(10, 10, 100)).toBe(10);
    expect(clamp(10, 0, 10)).toBe(10);
    expect(clamp(10, 10, 10)).toBe(10);
    expect(clamp(10, 11, 10)).toBe(11);
    expect(clamp(10, 10, 11)).toBe(10);
  });
});
