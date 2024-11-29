
import { createPuzzleBench } from "../../utils/create-puzzle-bench.ts";
import puzzle from "./day-08.ts";

await createPuzzleBench({
  year: 2022,
  day: 8,
  baseline: puzzle,
  implementations: [],
  testEasy: true,
  testHard: true,
  realEasy: true,
  realHard: true,
});
