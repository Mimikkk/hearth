import { createPuzzleTest } from "../../utils/create-puzzle-test.ts";
import puzzle from "./day-05.ts";

createPuzzleTest({
  year: 2022,
  day: 5,
  puzzle,
  easyTest: "CMZ",
  realEasy: "QMBMJDFTD",
  hardTest: "MCD",
  realHard: "NBTVTJNFJ",
});
