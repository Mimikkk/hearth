import { memoize, memoized } from "./memoize.ts";
import { describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";

describe("Library - aoc - utils - memoize", () => {
  it("should cache function results", () => {
    let calls = 0;
    const memoized = memoize((a: number, b: number) => {
      ++calls;

      return a + b;
    });

    expect(memoized(1, 2)).toBe(3);
    expect(calls).toBe(1);

    expect(memoized(1, 2)).toBe(3);
    expect(calls).toBe(1);

    expect(memoized(2, 3)).toBe(5);
    expect(calls).toBe(2);
  });

  it("should use custom key generator", () => {
    let calls = 0;
    const memoized = memoize(
      (item: { id: number }) => {
        ++calls;

        return item.id;
      },
      ({ id }) => id,
    );

    expect(memoized({ id: 1 })).toBe(1);
    expect(memoized({ id: 1 })).toBe(1);
    expect(calls).toBe(1);
  });

  it("should expose cache for manual management", () => {
    const memoized = memoize((x: number) => x * 2);

    memoized(5);
    expect(memoized.cache.size).toBe(1);

    memoized.cache.clear();
    expect(memoized.cache.size).toBe(0);
  });

  it("should memoize class methods", () => {
    let calls = 0;
    class Greeter {
      constructor(public message: string) {}

      @memoized()
      greet(argument: string) {
        ++calls;

        return "Hello, " + this.message + " and " + argument;
      }
    }

    expect(calls).toBe(0);
    const greeter = new Greeter("World");
    expect(greeter.greet("a")).toBe("Hello, World and a");
    expect(calls).toBe(1);
    expect(greeter.greet("a")).toBe("Hello, World and a");
    expect(calls).toBe(1);
    expect(greeter.greet("b")).toBe("Hello, World and b");
    expect(calls).toBe(2);
    expect(greeter.greet("a")).toBe("Hello, World and a");
    expect(calls).toBe(2);

    const greeter2 = new Greeter("Gordon");
    expect(greeter2.greet("a")).toBe("Hello, Gordon and a");
    expect(calls).toBe(3);
    expect(greeter2.greet("a")).toBe("Hello, Gordon and a");
    expect(calls).toBe(3);
    expect(greeter2.greet("b")).toBe("Hello, Gordon and b");
    expect(calls).toBe(4);
    expect(greeter2.greet("a")).toBe("Hello, Gordon and a");
    expect(calls).toBe(4);
  });
});
