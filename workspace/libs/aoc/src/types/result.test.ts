import { expect } from "jsr:@std/expect";
import { describe, it } from "jsr:@std/testing/bdd";
import { Result } from "./result.ts";

describe("Result", () => {
  it("ok", () => {
    expect(Result.ok(4)).toEqual({ ok: true, value: 4 });
  });

  it("err", () => {
    expect(Result.err("error")).toEqual({ ok: false, error: "error" });
  });

  it("should handle null and undefined values", () => {
    expect(Result.ok(null)).toEqual({ ok: true, value: null });
    expect(Result.ok(undefined)).toEqual({ ok: true, value: undefined });
  });

  describe("map", () => {
    it("should map successful results", () => {
      expect(Result.map(Result.ok(4), (value) => value + 1)).toEqual(Result.ok(5));
      expect(Result.map(Result.ok(4), (value) => value.toString())).toEqual(Result.ok("4"));
    });

    it("should preserve errors when mapping", () => {
      expect(Result.map<number, string, number>(Result.err("error"), (value) => value + 1))
        .toEqual(Result.err("error"));
    });
  });

  describe("amap", () => {
    it("should map async successful results", async () => {
      expect(await Result.amap(Promise.resolve(Result.ok(4)), (value) => value + 1))
        .toEqual(Result.ok(5));
      // deno-lint-ignore require-await
      expect(await Result.amap(Promise.resolve(Result.ok(4)), async (value) => value * 2))
        .toEqual(Result.ok(8));
    });

    it("should preserve errors in async operations", async () => {
      expect(
        await Result.amap<number, string, number>(
          Promise.resolve(Result.err("error")),
          (value) => value + 1,
        ),
      ).toEqual(Result.err("error"));
    });

    it("should handle rejected promises", async () => {
      await expect(Result.amap(Promise.reject("rejected"), (value) => value))
        .rejects.toBe("rejected");
    });
  });
});
