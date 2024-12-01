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
    "@mimi/ui-components": "workspace/libs/ui-components",
    "@mimi/ui-signals": "workspace/libs/ui-signals",
    "@mimi/ui-logic-components": "workspace/libs/ui-logic-components",
  },
  dependencies: {
    "@mimi/ui-components": ["@mimi/hearth-math", "@mimi/ui-signals"],
    "@mimi/ui-logic-components": ["@mimi/ui-components", "@mimi/ui-signals"],
    "@mimi/ui-signals": [],
    "@mimi/hearth": ["@mimi/hearth-math"],
    "@mimi/hearth-math": [],
    "@mimi/aoc": [],
  },
});

export type ApplicationName = keyof typeof config.applications;
export type LibraryName = keyof typeof config.libraries;
export const resolver = createLibraryResolver(config);
