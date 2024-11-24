import { createPuzzleTest } from "../../utils/create-puzzle-test.ts";
import puzzle from "./day-01.ts";

createPuzzleTest({
  year: 2022,
  day: 1,
  puzzle,
  easyTest: 24000,
  realEasy: 71506,
  hardTest: 45000,
  realHard: 209603,
});
