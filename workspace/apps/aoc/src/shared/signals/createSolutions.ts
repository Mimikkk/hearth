import { Files, Puzzle } from "@mimi/aoc";
import { Urls } from "@mimi/aoc/2022";
import { createEffect, createResource } from "solid-js";
import { createStore } from "solid-js/store";

export const createSolutions = <T, H, R>(puzzle: Puzzle<T, H, R>) => {
  const [content] = createResource(() => Files.text(Urls.day01.easy.real));

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
