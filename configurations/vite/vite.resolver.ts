import { dirname, fromFileUrl, resolve } from "jsr:@std/path";
import type { AliasOptions, BuildOptions, ResolverFunction } from "npm:vite";
import { dependencies, entry, type LibraryName } from "../library/libraries.config.ts";

export const resolveRoot = () => resolve(dirname(fromFileUrl(import.meta.url)), "../../");

export interface CreateResolverOptions {
  root: string;
}

export const createResolver = ({ root }: CreateResolverOptions): ResolverFunction => (slug: string) => {
  const resolvedId = resolve(root, slug);

  return { id: resolvedId, attributes: { path: resolvedId } };
};

const _resolver = createResolver({ root: resolveRoot() });

export const createResolveAlias = (
  libaries: LibraryName[],
  resolver: ResolverFunction = _resolver,
): AliasOptions =>
  dependencies(libaries).map((name) => ({
    find: name,
    replacement: entry(name),
    customResolver: resolver,
  }));

export const createLibraryBuild = (): BuildOptions => ({
  outDir: "build",
  lib: {
    entry: "./src/mod.ts",
    formats: ["es"],
  },
});
