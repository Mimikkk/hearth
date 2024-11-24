import { Files, Puzzle } from "@mimi/aoc";
import { createEffect, createResource } from "solid-js";
import { createStore } from "solid-js/store";
import { urlOf } from "../../../../../libs/aoc/src/2022/url-of.ts";

export const createSolutions = <T, H, R>(puzzle: Puzzle<T, H, R>) => {
  const [content] = createResource(() => Files.text(urlOf(1, "real", "easy")));

  const [results, setResults] = createStore<{
    easy: ReturnType<typeof puzzle.easy> | null;
    hard: ReturnType<typeof puzzle.hard> | null;
  }>({ easy: null, hard: null });

  createEffect(() => {
    if (content.state !== "ready") return;

    const result = content();
    if (!result.ok) throw Error(result.error);

    setResults({
      easy: puzzle.easy(result.value),
      hard: puzzle.hard(result.value),
    });
  });

  return results;
};
