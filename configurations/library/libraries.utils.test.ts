import { expect } from "jsr:@std/expect";
import { describe, it } from "jsr:@std/testing/bdd";
import { createLibraryConfig, createLibraryResolver } from "./libraries.utils.ts";

describe("Configuration - Library - resolver", () => {
  it("detect valid configuration paths for single library name", () => {
    const config = createLibraryConfig({
      applications: {},
      libraries: {
        "lib-a": "path/to/lib-a",
        "lib-b": "path/to/lib-b",
        "lib-c": "path/to/lib-c",
        "lib-d": "path/to/lib-d",
      },
      dependencies: {
        "lib-a": [],
        "lib-b": ["lib-a"],
        "lib-c": ["lib-a", "lib-b"],
        "lib-d": ["lib-c"],
      },
    });

    const resolver = createLibraryResolver(config);

    expect(resolver.paths("lib-d")).toEqual([
      "path/to/lib-d",
      "path/to/lib-c",
      "path/to/lib-b",
      "path/to/lib-a",
    ]);
  });

  it("detect valid configuration paths for multiple library names", () => {
    const config = createLibraryConfig({
      applications: {},
      libraries: {
        "lib-a": "path/to/lib-a",
        "lib-b": "path/to/lib-b",
        "lib-c": "path/to/lib-c",
        "lib-d": "path/to/lib-d",
      },
      dependencies: {
        "lib-a": [],
        "lib-b": ["lib-a"],
        "lib-c": ["lib-a"],
        "lib-d": ["lib-b", "lib-c"],
      },
    });

    const resolver = createLibraryResolver(config);

    expect(resolver.paths(["lib-b", "lib-c"])).toEqual([
      "path/to/lib-c",
      "path/to/lib-a",
      "path/to/lib-b",
    ]);
  });

  it("detect circular dependency", () => {
    const config = createLibraryConfig({
      applications: {},
      libraries: {
        "lib-x": "path/to/lib-x",
        "lib-y": "path/to/lib-y",
        "lib-z": "path/to/lib-z",
      },
      dependencies: {
        "lib-x": ["lib-y"],
        "lib-y": ["lib-z"],
        "lib-z": ["lib-x"],
      },
    });

    const resolver = createLibraryResolver(config);

    expect(() => resolver.dependencies("lib-x")).toThrow(
      "Circular dependency detected: lib-x -> lib-y -> lib-z -> lib-x",
    );
  });

  it("visualize library graph", () => {
    const config = createLibraryConfig({
      applications: {},
      libraries: {
        "lib-a": "path/to/lib-a",
        "lib-b": "path/to/lib-b",
        "lib-c": "path/to/lib-c",
        "lib-d": "path/to/lib-d",
      },
      dependencies: {
        "lib-a": ["lib-b"],
        "lib-b": ["lib-c"],
        "lib-c": ["lib-d"],
        "lib-d": [],
      },
    });

    const resolver = createLibraryResolver(config);

    expect(resolver.visualize()).toEqual(
      'digraph LibraryDependencies {\n  "lib-a" -> "lib-b";\n  "lib-b" -> "lib-c";\n  "lib-c" -> "lib-d";\n}',
    );
  });
});
