import { Files } from "@mimi/aoc";
import { Days, Urls } from "@mimi/aoc/2022";
import { createEffect, createResource } from "solid-js";
import { createStore } from "solid-js/store";
import { render } from "solid-js/web";
import "./styles.css";

const createDayResources = () => {
  const day = Days[1];
  const [content] = createResource(() => Files.text(Urls[1].easy.real));

  const [results, setResults] = createStore<{
    easy: ReturnType<typeof day.easy.task> | null;
    hard: ReturnType<typeof day.hard.task> | null;
  }>({ easy: null, hard: null });

  createEffect(() => {
    if (content.state !== "ready") return;

    const result = content();
    if (!result.ok) throw Error(result.error);

    const prepared = day.prepare(result.value);
    setResults({
      easy: day.easy.task(day.easy.prepare?.(prepared) ?? prepared),
      hard: day.hard.task(day.hard.prepare?.(prepared) ?? prepared),
    });
  });

  return results;
};

render(() => {
  const results = createDayResources();

  return <div>AOC2022 + {results.easy} + {results.hard}</div>;
}, document.getElementById("root")!);
