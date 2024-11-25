import { createPuzzleBench } from "../../utils/create-puzzle-bench.ts";
import puzzle from "./day-06.ts";

await createPuzzleBench({
  year: 2022,
  day: 6,
  baseline: puzzle,
  implementations: [],
  testEasy: true,
  testHard: true,
  realEasy: true,
  realHard: true,
});
