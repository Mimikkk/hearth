
import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";

export default Puzzle.new({
  prepare: Str.lines,
  easy: () => 0,
  hard: () => 0,
});
