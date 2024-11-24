/**
 * @module aoc
 *
 * @description
 * AOC is a series of daily programming challenges that take place in December.
 *
 * @example
 * import { Puzzles } from "@mimi/aoc/2022";
 *
 * Puzzles.day01();
 */
import day01 from "./day-01/day-01.ts";

export const Puzzles = {
  day01,
} as const;
