import { createPuzzleTest } from "../../utils/create-puzzle-test.ts";
import puzzle from "./day-09.ts";

createPuzzleTest({
  puzzle,
  easyTest: 13,
  easyUser: 6384,
  hardTest: 36,
  hardUser: 2734,
  easyTestInput: "type:input-test-easy",
  hardTestInput: "type:input-test-hard",
});
