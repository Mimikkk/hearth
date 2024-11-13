import { resolve } from "jsr:@std/path";

export interface LibraryConfig<
  LibraryName extends string,
  ApplicationName extends string,
> {
  libraries: Record<LibraryName, string>;
  applications: Record<ApplicationName, string>;
  dependencies: Record<NoInfer<LibraryName>, NoInfer<LibraryName>[]>;
}

export const createLibraryConfig = <
  const LibraryName extends string,
  const ApplicationName extends string,
>(config: LibraryConfig<LibraryName, ApplicationName>): LibraryConfig<LibraryName, ApplicationName> => config;

export const createLibraryResolver = <
  const LibraryName extends string,
  const ApplicationName extends string,
>(config: LibraryConfig<LibraryName, ApplicationName>) => {
  const pathOf = (library: LibraryName): string => config.libraries[library];

  const readDependencies = (libraries: LibraryName[]): LibraryName[] => {
    const visited = new Set<LibraryName>();
    const stack: [LibraryName, LibraryName[]][] = libraries.map((lib) => [lib, []]);

    while (stack.length > 0) {
      const [lib, path] = stack.pop()!;

      if (path.includes(lib)) {
        throw Error(`Circular dependency detected: ${path.join(" -> ")} -> ${lib}`);
      }
      if (visited.has(lib)) continue;

      visited.add(lib);

      const dependencies = config.dependencies[lib];
      if (dependencies) {
        for (const dependency of dependencies) {
          stack.push([dependency, [...path, lib]]);
        }
      }
    }

    return [...visited];
  };

  const dependencies = (
    libraries: LibraryName | LibraryName[],
  ): LibraryName[] => readDependencies(Array.isArray(libraries) ? libraries : [libraries]);

  const paths = (
    libraries: LibraryName | LibraryName[],
  ): string[] => dependencies(libraries).map(pathOf);

  const visualize = (): string => {
    let graph = "digraph LibraryDependencies {\n";
    for (const [library, deps] of Object.entries(config.dependencies)) {
      for (const dep of deps as LibraryName[]) {
        graph += `  "${library}" -> "${dep}";\n`;
      }
    }
    graph += "}";
    return graph;
  };

  const find = (path: string): LibraryName | null => {
    let longestMatch: LibraryName | null = null;
    let maxLength = 0;

    for (const library in config.libraries) {
      if (path.startsWith(library) && library.length > maxLength) {
        longestMatch = library;
        maxLength = library.length;
      }
    }

    return longestMatch;
  };

  let cwd = Deno.cwd().replace(/\\/g, "/");
  for (const path of Object.values<string>(config.libraries)) {
    if (cwd.endsWith(path)) {
      cwd = cwd.replace(`/${path}`, "");
      break;
    }
  }

  for (const path of Object.values<string>(config.applications)) {
    if (cwd.endsWith(path)) {
      cwd = cwd.replace(`/${path}`, "");
      break;
    }
  }

  const jsonOf = async (library: LibraryName) => {
    const basePath = resolve(cwd, pathOf(library));
    const files = ["deno.json", "deno.jsonc", "package.json"];

    for (const file of files) {
      try {
        const result = await import(`file:///${resolve(basePath, file)}`, { with: { type: "json" } });
        return result.default;
      } catch {
        continue;
      }
    }

    throw new Error(`No configuration file found for library '${library}'. Tried: ${files.join(", ")}`);
  };

  const entryOf = (library: LibraryName, slug: string): string => resolve(cwd, pathOf(library), slug);

  return { dependencies, paths, visualize, find, pathOf, entryOf, jsonOf, cwd };
};
