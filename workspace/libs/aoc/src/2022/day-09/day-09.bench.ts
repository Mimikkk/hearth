import { createPuzzleBench } from "../../utils/create-puzzle-bench.ts";
import puzzle from "./day-09.ts";

await createPuzzleBench({
  year: 2022,
  day: 9,
  baseline: puzzle,
  implementations: [],
  testEasy: true,
  testHard: true,
  realEasy: true,
  realHard: true,
});
