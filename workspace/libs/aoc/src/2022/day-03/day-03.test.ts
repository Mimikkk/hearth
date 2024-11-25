import { createPuzzleTest } from "../../utils/create-puzzle-test.ts";
import puzzle from "./day-03.ts";

createPuzzleTest({
  year: 2022,
  day: 3,
  puzzle,
  easyTest: 157,
  realEasy: 8401,
  hardTest: 70,
  realHard: 2641,
});