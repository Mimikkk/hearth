import { createLibraryConfig, createLibraryResolver } from "./libraries.utils.ts";

export const config = createLibraryConfig({
  applications: {
    "web": "workspace/apps/web",
  },
  libraries: {
    "hearth": "workspace/libs/hearth",
  },
  dependencies: {
    "hearth": [],
  },
});

export type ApplicationName = keyof typeof config.applications;
export type LibraryName = keyof typeof config.libraries;
export const { dependencies, paths, visualize, path, entry } = createLibraryResolver(config);
