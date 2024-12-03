
import { createPuzzleBench } from "../../utils/create-puzzle-bench.ts";
import puzzle from "./day-03.ts";

await createPuzzleBench({
  year: 2024,
  day: 3,
  baseline: puzzle,
  implementations: [],
  testEasy: true,
  testHard: true,
  realEasy: true,
  realHard: true,
});
