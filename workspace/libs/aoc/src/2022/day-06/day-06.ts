import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";

export default Puzzle.create({
  prepare: Str.trim,
  easy: () => 0,
  hard: () => 0,
});
