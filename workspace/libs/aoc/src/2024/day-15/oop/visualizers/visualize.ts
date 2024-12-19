import { goTo } from "https://denopkg.com/iamnathanj/cursor@v2.2.0/mod.ts";
import { colors } from "jsr:@cliffy/ansi@1.0.0-rc.7/colors";
import { keypress } from "jsr:@cliffy/keypress@1.0.0-rc.7";
import { GridVisualizer, type Marker } from "../../../../visualizers/grid.ts";
import type { Obstacle } from "../classes/entities/Obstacle.ts";
import type { Player } from "../classes/entities/Player.ts";
import type { Walls } from "../classes/entities/Walls.ts";
import type { PuzzleInput } from "../classes/PuzzleInput.ts";
import { Direction } from "../enums/direction.enum.ts";
import { Movement } from "../logic/movement.ts";
import { Scores } from "../logic/scores.ts";
import { History } from "./History.ts";
import { HistoryRecord } from "./HistoryRecord.ts";

const visualize = (obstacles: Obstacle[], walls: Walls, player: Player) => {
  const maxX = Math.max(...walls.positions.map((p) => p.x));
  const maxY = Math.max(...walls.positions.map((p) => p.y));

  const v = GridVisualizer.fromBounds(maxX + 1, maxY + 1);

  v.fill(colors.gray("."));
  v.add(walls.positions.map((p) => [p.x, p.y, colors.gray("#")] as const));
  v.add(obstacles.flatMap((o): Marker[] => {
    if (o.positions.length === 1) return o.positions.map((p) => [p.x, p.y, colors.yellow("O")]);

    const left = o.positions[0];
    const right = o.positions[1];

    return [[left.x, left.y, colors.yellow("[")], [right.x, right.y, colors.yellow("]")]];
  }));
  v.add([player.position.x, player.position.y, colors.red("@")] as const);

  return v.str();
};

const view = async ({ input, moves }: HistoryRecord, options?: {
  header?: string;
}) => {
  await goTo(0, 0);
  const lines: string[] = [];
  lines.push(options?.header || "");
  lines.push(`x:${input.player.position.x}, y:${input.player.position.y}`);
  const vizLines = visualize(input.obstacles, input.walls, input.player).split("\n");
  lines.push(...vizLines);
  for (let i = 0; i < moves.length; i += 60) {
    if (lines.length > 70) break;
    const chunk = moves.slice(i, i + 60).join("");
    lines.push(chunk);
  }

  for (let i = 0; i < input.moves.length; i += 60) {
    if (lines.length > 70) break;
    const chunk = input.moves.slice(i, i + 60);

    const highlighted = chunk.map((move, j) => {
      return moves[i + j] === move ? colors.green(move) : colors.gray(move);
    }).join("");

    lines.push(highlighted);
  }

  lines.push(`Score: ${colors.yellow(Scores.obstacles(input.obstacles).toString())}`);
  lines.push("Waiting for input..., r to reset, b to go back, q to quit. wsad to move.");
  while (lines.length < 40) lines.push("");
  console.log(lines.map((line) => line.padEnd(100, " ")).join("\n"));
};

const findMove = (key: string, index: number, expected: Direction[]): Direction | undefined => {
  if (key === "n") return expected[index];
  if (key === "w") return Direction.Up;
  if (key === "s") return Direction.Down;
  if (key === "a") return Direction.Left;
  if (key === "d") return Direction.Right;
  return undefined;
};

export const play = async (input: PuzzleInput) => {
  let active = HistoryRecord.new(input);

  console.clear();
  await view(active);

  const history = History.fromSize<HistoryRecord>(500);
  for await (const event of keypress()) {
    if (!event.key) continue;

    if (event.key === "q") {
      keypress().dispose();
      break;
    }

    if (event.key === "r") {
      if (history.memory.length > 0) {
        active = history.memory[0]!;
        history.memory.length = 0;
        await view(active, {
          header: `Gone back. History: ${colors.yellow(`${history.memory.length}`)}`,
        });
      }

      continue;
    } else if (event.key === "b") {
      if (history.memory.length > 0) {
        active = history.pop()!;

        await view(active, {
          header: `Gone back. History: ${colors.yellow(`${history.memory.length}`)}`,
        });
      }

      continue;
    }

    const move = findMove(event.key, active.moves.length, input.moves);
    if (move) {
      history.push(active);
      active.moves.push(move);

      Movement.move(move, active.input.player, active.input.obstacles, active.input.walls);
      await view(active, {
        header: `Moved ${colors.yellow(`${Direction.toString(move)}`)}. History: ${
          colors.yellow(`${history.memory.length}`)
        }`,
      });

      continue;
    }
    await view(active, { header: `Not moved. History: ${colors.yellow(`${history.memory.length}`)}` });
  }

  return Scores.obstacles(active.input.obstacles);
};
