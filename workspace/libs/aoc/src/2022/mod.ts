/**
 * @module aoc
 *
 * @description
 * AOC is a series of daily programming challenges that take place in December.
 *
 * @example
 * import { days } from "@mimi/aoc/2022";
 *
 * days[1](); // "aoc2022"
 */
import { day01 } from "./day-01.ts";

export const days = {
  1: day01,
} as const;
