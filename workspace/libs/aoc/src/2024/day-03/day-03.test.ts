import { createPuzzleTest } from "../../utils/create-puzzle-test.ts";
import puzzle from "./day-03.ts";

createPuzzleTest({
  year: 2024,
  day: 3,
  puzzle,
  easyTest: 161,
  easyUser: 160672468,
  hardTest: 48,
  hardUser: 84893551,
  hardTestInput: "xmul(2,4)&mul[3,7]!^don't()_mul(5,5)+mul(32,64](mul(11,8)undo()?mul(8,5))",
});
