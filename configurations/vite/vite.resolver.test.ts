import { expect } from "jsr:@std/expect";
import { describe, it } from "jsr:@std/testing/bdd";
import type { Alias, ResolverFunction } from "vite";
import { createAlias } from "./vite.resolver.ts";

describe("Configuration - Vite - resolver", () => {
  it("resolves the path", () => {
    const alias = createAlias(["@mimi/aoc"]) as Alias[];
    const resolver = alias[0].customResolver as (value: string) => ReturnType<ResolverFunction>;

    expect(resolver("@mimi/aoc/2022")).not.toThrow();
  });
});
