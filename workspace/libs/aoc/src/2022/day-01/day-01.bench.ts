import { createPuzzleBench } from "../../utils/create-puzzle-bench.ts";
import puzzle from "./day-01.ts";

await createPuzzleBench({
  year: 2022,
  day: 1,
  baseline: puzzle,
  implementations: [],
  testEasy: true,
  testHard: true,
});
