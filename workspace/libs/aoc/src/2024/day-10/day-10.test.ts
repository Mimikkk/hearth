import { createPuzzleTest } from "../../utils/create-puzzle-test.ts";
import puzzle from "./day-10.ts";

createPuzzleTest({
  puzzle,
  easyTest: 36,
  easyTestInput: "type:input-test-big",
  easyUser: 811,
  hardTest: 81,
  hardTestInput: "type:input-test-big",
  hardUser: 1794,
});
