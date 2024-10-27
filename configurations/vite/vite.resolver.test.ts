import { expect } from "jsr:@std/expect";
import { describe, it } from "jsr:@std/testing/bdd";
import { resolveRoot } from "./vite.resolver.ts";

describe("Configuration - Vite - resolver", () => {
  it("resolves the root", () => {
    expect(resolveRoot()).toBe(Deno.cwd());
  });
});
