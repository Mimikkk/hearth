import { createPuzzleTest } from "../../utils/create-puzzle-test.ts";
import puzzle from "./day-01.ts";

createPuzzleTest({
  puzzle,
  easyTest: 24000,
  easyUser: 71506,
  hardTest: 45000,
  hardUser: 209603,
});
