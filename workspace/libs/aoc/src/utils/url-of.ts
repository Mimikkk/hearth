export const urlOf = (year: number, day: number, type: InputType, difficulty: Difficulty): URL =>
  new URL(`../${year}/resources/day-${day.toString().padStart(2, "0")}/${type}-${difficulty}.txt`, import.meta.url);

export type InputType = "test" | "real";
export type Difficulty = "easy" | "hard";
