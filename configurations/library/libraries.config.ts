import { createLibraryConfig, createLibraryResolver } from "./libraries.utils.ts";

export const config = createLibraryConfig({
  applications: {
    "web": "workspace/apps/web",
  },
  libraries: {
    "@mimi/hearth": "workspace/libs/hearth",
    "@mimi/hearth-math": "workspace/libs/hearth-math",
  },
  dependencies: {
    "@mimi/hearth": ["@mimi/hearth-math"],
    "@mimi/hearth-math": [],
  },
});

export type ApplicationName = keyof typeof config.applications;
export type LibraryName = keyof typeof config.libraries;
export const { dependencies, paths, visualize, path, entry } = createLibraryResolver(config);
