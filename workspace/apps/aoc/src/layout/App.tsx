import { Puzzles } from "@mimi/aoc/2022";
import { createSolutions } from "../shared/signals/createSolutions.ts";

export const App = () => {
  const solutions = createSolutions(Puzzles.day01);

  return <div>AOC2022 + {solutions.easy} + {solutions.hard}</div>;
};
