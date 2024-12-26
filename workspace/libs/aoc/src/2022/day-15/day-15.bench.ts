
import { createPuzzleBench } from "../../utils/create-puzzle-bench.ts";
import puzzle from "./day-15.ts";

await createPuzzleBench({
  baseline: puzzle,
  implementations: [],
  testEasy: true,
  testHard: true,
  realEasy: true,
  realHard: true,
});