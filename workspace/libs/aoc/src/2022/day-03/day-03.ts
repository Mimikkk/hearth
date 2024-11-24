import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/text.ts";

const easy = () => 0;
const hard = () => 0;

export default Puzzle.create({
  prepare: Str.lines,
  easy: {
    task: hard,
  },
  hard: {
    task: hard,
  },
});
