import { createPuzzleTest } from "../../utils/create-puzzle-test.ts";
import puzzle from "./day-02.ts";

createPuzzleTest({
  year: 2022,
  day: 2,
  puzzle,
  easyTest: 15,
  realEasy: 13052,
  hardTest: 12,
  realHard: 13693,
});
