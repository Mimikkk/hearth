import { createPuzzleTest } from "../../utils/create-puzzle-test.ts";
import puzzle from "./day-18.ts";

createPuzzleTest({
  puzzle,
  easyTest: 22,
  easyTestInput: "type:input-test-easy",
  easyUser: 294,
  easyUserInput: "type:input-user-easy",
  hardTest: "6,1",
  hardTestInput: "type:input-test-hard",
  hardUser: "31,22",
  hardUserInput: "type:input-user-hard",
});
