import { createPuzzleTest } from "../../utils/create-puzzle-test.ts";
import puzzle from "./day-17.ts";

createPuzzleTest({
  puzzle,
  easyTest: "4,6,3,5,6,3,5,2,1,0",
  easyUser: "7,3,5,7,5,7,4,3,0",
  hardTest: 117440,
  hardTestInput: "type:input-test-hard",
  hardUser: 117440,
});
