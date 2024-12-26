import type { Const } from "../../types/const.ts";
import { Vec2 } from "../../types/math/Vec2.ts";
import { Puzzle } from "../../types/puzzle.ts";
import { sumBy } from "../../utils/maths.ts";
import { memoize } from "../../utils/memoize.ts";
import { Str } from "../../utils/strs.ts";

const parseCodes = (content: string): NumericKey[][] =>
  Str.lines(content).map((line) => line.split("") as NumericKey[]);

type KeyMap<K extends string> = Map<K, Vec2>;

const orthogonals = [
  // Left Right Up Down
  Vec2.new(0, -1),
  Vec2.new(0, 1),
  Vec2.new(-1, 0),
  Vec2.new(1, 0),
] as const;

class Keypad<K extends string> {
  static new<K extends string>(keypad: KeyMap<K> = new Map()): Keypad<K> {
    return new Keypad(keypad);
  }

  static from<K extends string>(keypad: Const<Keypad<K>>, into: Keypad<K> = Keypad.new()): Keypad<K> {
    return into.from(keypad);
  }

  static fromLayout<K extends string>(
    keypad: Const<Iterable<[key: K, position: Vec2]>>,
    into: Keypad<K> = Keypad.new(),
  ): Keypad<K> {
    return into.fromLayout(keypad);
  }

  private constructor(public keymap: KeyMap<K>) {}

  key(key: K): Vec2 {
    return this.keymap.get(key)!;
  }

  from(keypad: Const<Keypad<K>>): this {
    return this.fromLayout(keypad.keymap.entries() as Iterable<[K, Vec2]>);
  }

  fromLayout(keypad: Iterable<[key: K, position: Vec2]>): this {
    this.keymap.clear();

    for (const [key, position] of keypad) {
      this.keymap.set(key, position);
    }

    return this;
  }

  getShortestPathsFromTo(from: K, to: K): K[][] {
    const destination = this.key(to);

    const paths: K[][] = [];
    let bestLength = Infinity;

    const source = this.key(from);
    const stack: [position: Vec2, path: K[]][] = [[source, []]];

    while (stack.length) {
      const [position, path] = stack.pop()!;

      if (position === destination) {
        if (path.length <= bestLength) {
          if (path.length < bestLength) {
            bestLength = path.length;
            paths.length = 0;
          }

          paths.push(path);
        }

        continue;
      }

      for (const { x, y } of orthogonals) {
        const xdx = position.x + x;
        const ydy = position.y + y;

        for (const [key, position] of this.keymap.entries()) {
          if (path.includes(key)) continue;

          const { x: px, y: py } = position;

          if (px !== xdx || py !== ydy) continue;
          stack.push([position, [...path, key]]);
        }
      }
    }

    return paths;
  }
}

const DirectionalKeypad = Keypad.fromLayout([
  ["^", Vec2.new(0, 1)],
  ["A", Vec2.new(0, 2)],
  ["<", Vec2.new(1, 0)],
  ["v", Vec2.new(1, 1)],
  [">", Vec2.new(1, 2)],
]);

const NumericKeypad = Keypad.fromLayout([
  ["7", Vec2.new(0, 0)],
  ["8", Vec2.new(0, 1)],
  ["9", Vec2.new(0, 2)],
  ["4", Vec2.new(1, 0)],
  ["5", Vec2.new(1, 1)],
  ["6", Vec2.new(1, 2)],
  ["1", Vec2.new(2, 0)],
  ["2", Vec2.new(2, 1)],
  ["3", Vec2.new(2, 2)],
  ["0", Vec2.new(3, 1)],
  ["A", Vec2.new(3, 2)],
]);

// class KeypadController<K extends string> {
//   static new<K extends string>(
//     keypad: Keypad<K> = Keypad.new(),
//     key: K | undefined = undefined,
//   ): KeypadController<K> {
//     return new KeypadController(keypad, key);
//   }

//   static fromParams<K extends string>(
//     keypad: Const<Keypad<K>>,
//     key: K,
//     into: KeypadController<K> = KeypadController.new(),
//   ): KeypadController<K> {
//     return into.fromParams(keypad, key);
//   }

//   private constructor(public keypad: Keypad<K>, public key: K | undefined) {}

//   fromParams(keypad: Const<Keypad<K>>, key: K): this {
//     this.keypad.from(keypad);
//     return this;
//   }

//   moveTo(to: K): K[] {
//     const path = this.keypad.pathFromTo(from, to);

//     this.position.from(this.keypad.key(path[path.length - 1]));

//     return path;
//   }
// }

type NumericKey = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "A";
type DirectionalKey = "^" | "A" | "<" | "v" | ">" | "B";

const calculateCodeNumber = (code: NumericKey[]): number => +code.filter((char) => char >= "0" && char <= "9").join("");
const calculateCodeAccessStrokeCount = (code: NumericKey[]): number => {
  let from: NumericKey = "A";
  console.log(NumericKeypad.getShortestPathsFromTo(from, "9"));

  return 0;
};

const calculateCodeComplexity = (code: NumericKey[]): number =>
  calculateCodeNumber(code) * calculateCodeAccessStrokeCount(code);

const sumShortestStrokeCounts = (codes: NumericKey[][]): number => {
  codes.length = 1;
  return sumBy(codes, calculateCodeComplexity);
};

export default Puzzle.new({
  prepare: parseCodes,
  easy: sumShortestStrokeCounts,
  hard: () => 0,
});

memoize(() => {});
