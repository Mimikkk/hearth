export const Urls = {
  day01: {
    easy: {
      test: new URL("./resources/day01/test-easy.txt", import.meta.url),
      real: new URL("./resources/day01/real-easy.txt", import.meta.url),
    },
    hard: {
      test: new URL("./resources/day01/test-hard.txt", import.meta.url),
      real: new URL("./resources/day01/real-hard.txt", import.meta.url),
    },
  },
  day02: {
    easy: {
      test: new URL("./resources/day02/test-easy.txt", import.meta.url),
      real: new URL("./resources/day02/real-easy.txt", import.meta.url),
    },
    hard: {
      test: new URL("./resources/day02/test-hard.txt", import.meta.url),
      real: new URL("./resources/day02/real-hard.txt", import.meta.url),
    },
  },
} as const satisfies Record<string, Record<Difficulty, Record<InputType, URL>>>;

export type Level = keyof typeof Urls;
export type InputType = "test" | "real";
export type Difficulty = "easy" | "hard";
