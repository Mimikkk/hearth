import { createLibraryConfig, createLibraryResolver } from "./libraries.utils.ts";

export const config = createLibraryConfig({
  applications: {
    "aoc": "workspace/apps/aoc",
    "web": "workspace/apps/web",
  },
  libraries: {
    "@mimi/hearth": "workspace/libs/hearth",
    "@mimi/hearth-math": "workspace/libs/hearth-math",
    "@mimi/aoc": "workspace/libs/aoc",
  },
  dependencies: {
    "@mimi/hearth": ["@mimi/hearth-math"],
    "@mimi/hearth-math": [],
    "@mimi/aoc": [],
  },
});

export type ApplicationName = keyof typeof config.applications;
export type LibraryName = keyof typeof config.libraries;
export const resolver = createLibraryResolver(config);
