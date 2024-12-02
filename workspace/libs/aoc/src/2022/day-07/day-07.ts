import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";

class Location {
  static new() {
    return new this([], [""]);
  }
  private constructor(private location: string[], private paths: string[]) {}

  path(): string {
    const paths = this.paths;
    return paths[paths.length - 1];
  }

  hasParent() {
    return this.location.length > 0;
  }

  parent(): string | undefined {
    const paths = this.paths;
    return paths[paths.length - 2];
  }

  move(path: string) {
    switch (path) {
      case "/":
        this.location.length = 0;
        this.paths.length = 1;
        break;
      case "..":
        this.location.pop();
        this.paths.pop();
        break;
      default:
        this.location.push(path);
        this.paths.push(this.location.join("/"));
        break;
    }
  }
}

const calcuateSizes = (lines: string[]) => {
  const location = Location.new();

  const parents = new Map<string, string>();
  const counts = new Map<string, number>();
  const sizes = new Map<string, number>();

  for (let i = 0; i < lines.length; ++i) {
    const line = lines[i];
    const [first, second, third] = line.split(" ");

    if (first === "$") {
      if (second === "ls") {
        const sourceStr = location.path();

        let count = counts.get(sourceStr);
        if (count !== undefined) {
          i += count;
          continue;
        }

        if (location.hasParent()) parents.set(sourceStr, location.parent()!);

        let size = 0;
        for (++i, count = 0; i < lines.length; ++i) {
          ++count;
          const line = lines[i];
          const [first] = line.split(" ");

          if (first !== "dir") {
            const filesize = +first;
            size += filesize;
          }

          if (lines[i + 1]?.[0] === "$") break;
        }
        counts.set(sourceStr, count);
        sizes.set(sourceStr, size);

        let path = parents.get(sourceStr);
        while (path !== undefined) {
          sizes.set(path, sizes.get(path)! + size);
          path = parents.get(path);
        }
      } else if (second === "cd") {
        location.move(third);
      }
    }
  }

  return sizes;
};

const sumOverSize = (sizes: Map<string, number>, value: number) => {
  let total = 0;
  for (const size of sizes.values()) {
    if (size >= value) continue;
    total += size;
  }
  return total;
};

const findSmallestToRemove = (sizes: Map<string, number>, value: number): number => {
  const DiskSpace = 70_000_000;
  const UsedSpace = sizes.get("")!;
  const ToFree = value + UsedSpace - DiskSpace;

  let min = UsedSpace;
  for (const size of sizes.values()) {
    if (size >= ToFree && size < min) min = size;
  }
  return min;
};

export default Puzzle.new({
  prepare: Str.lines,
  easy: (lines) => sumOverSize(calcuateSizes(lines), 100_000),
  hard: (lines) => findSmallestToRemove(calcuateSizes(lines), 30_000_000),
});
