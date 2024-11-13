import type { AliasOptions, BuildOptions, ResolverFunction } from "vite";
import { type LibraryName, resolver } from "../library/libraries.config.ts";

export const createAliasResolver = (): ResolverFunction => async (slug: string) => {
  const library = resolver.find(slug);
  if (!library) throw new Error(`Library not found: '${slug}'`);

  const json = await resolver.jsonOf(library);
  const entries = json.exports;
  if (!entries) throw new Error(`Library has no exports: '${library}'`);

  const entry = typeof entries === "string" ? entries : entries[slug.replace(library, ".")];
  if (!entry) throw new Error(`Library has no entry for slug: '${slug}'`);

  const path = resolver.entryOf(library, entry);
  return { id: path, attributes: { path } };
};

const _resolver = createAliasResolver();

export const createAlias = (libaries: LibraryName[], aliasResolver: ResolverFunction = _resolver): AliasOptions =>
  resolver.dependencies(libaries).map((library) => ({
    find: library,
    replacement: library,
    customResolver: aliasResolver,
  }));

export const createLibraryBuild = (): BuildOptions => ({
  outDir: "build",
  lib: {
    entry: "./src/mod.ts",
    formats: ["es"],
  },
});
