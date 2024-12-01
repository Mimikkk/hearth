
import { createPuzzleBench } from "../../utils/create-puzzle-bench.ts";
import puzzle from "./day-07.ts";

await createPuzzleBench({
  year: 2022,
  day: 7,
  baseline: puzzle,
  implementations: [],
  testEasy: true,
  testHard: true,
  realEasy: true,
  realHard: true,
});
