export const Urls = {
  day01: {
    easy: {
      test: new URL("./resources/day-01-test-easy.txt", import.meta.url),
      real: new URL("./resources/day-01-real-easy.txt", import.meta.url),
    },
    hard: {
      test: new URL("./resources/day-01-test-hard.txt", import.meta.url),
      real: new URL("./resources/day-01-real-hard.txt", import.meta.url),
    },
  },
} as const satisfies Record<string, Record<Difficulty, Record<InputType, URL>>>;

export type Level = keyof typeof Urls;
export type InputType = "test" | "real";
export type Difficulty = "easy" | "hard";
