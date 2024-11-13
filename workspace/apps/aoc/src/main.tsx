import { days } from "@mimi/aoc/2022";
import { render } from "solid-js/web";
import "./styles.css";

render(() => <div>AOC2022 + {days[1]()}</div>, document.getElementById("root")!);
