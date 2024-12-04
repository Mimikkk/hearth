
import { createPuzzleBench } from "../../utils/create-puzzle-bench.ts";
import puzzle from "./day-04.ts";

await createPuzzleBench({
  year: 2024,
  day: 4,
  baseline: puzzle,
  implementations: [],
  testEasy: true,
  testHard: true,
  realEasy: true,
  realHard: true,
});
