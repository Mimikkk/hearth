import { createPuzzleTest } from "../../utils/create-puzzle-test.ts";
import puzzle from "./day-12.ts";

createPuzzleTest({
  puzzle,
  easyTest: 1930,
  easyTestInput: "type:input-test-big",
  easyUser: 1344578,
  hardTest: 436,
  hardTestInput: "type:input-test-medium",
  hardUser: 814302,
});
