export const urlOf = (year: number, day: number, type: InputType): URL =>
  new URL(`../${year}/resources/day-${day.toString().padStart(2, "0")}/${type}.txt`, import.meta.url);

export type InputType = "test-user" | "real-user";
export type Difficulty = "easy" | "hard";
