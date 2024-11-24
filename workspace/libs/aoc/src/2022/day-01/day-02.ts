import { Puzzle } from "../../types/puzzle.ts";
import { sum } from "../../utils/math.ts";
import { Str } from "../../utils/text.ts";

enum Outcome {
  Win = "win",
  Lose = "lose",
  Draw = "draw",
}

enum Choice {
  Rock = "rock",
  Paper = "paper",
  Scissor = "scissor",
}

type Round = [opponent: Choice, player: Choice];
type Match = Round[];

const evaluateRound = ([opponent, player]: Round): Outcome => {
  switch (player) {
    case Choice.Rock:
      switch (opponent) {
        case Choice.Rock:
          return Outcome.Draw;
        case Choice.Paper:
          return Outcome.Lose;
        case Choice.Scissor:
          return Outcome.Win;
        default:
          throw Error(`Invalid opponent shape: '${opponent}'`);
      }
    case Choice.Paper:
      switch (opponent) {
        case Choice.Rock:
          return Outcome.Win;
        case Choice.Paper:
          return Outcome.Draw;
        case Choice.Scissor:
          return Outcome.Lose;
        default:
          throw Error(`Invalid opponent shape: '${opponent}'`);
      }
    case Choice.Scissor:
      switch (opponent) {
        case Choice.Rock:
          return Outcome.Lose;
        case Choice.Paper:
          return Outcome.Win;
        case Choice.Scissor:
          return Outcome.Draw;
        default:
          throw Error(`Invalid opponent shape: '${opponent}'`);
      }
    default:
      throw Error(`Invalid player shape: '${opponent}'`);
  }
};

const scoreOutcome = (outcome: Outcome): number => {
  switch (outcome) {
    case Outcome.Win:
      return 6;
    case Outcome.Draw:
      return 3;
    case Outcome.Lose:
      return 0;
    default:
      throw Error(`Invalid outcome: '${outcome}'`);
  }
};

const scoreShape = (shape: Choice): number => {
  switch (shape) {
    case Choice.Rock:
      return 1;
    case Choice.Paper:
      return 2;
    case Choice.Scissor:
      return 3;
    default:
      throw Error(`Invalid shape: '${shape}'`);
  }
};

const scoreRound = (round: Round): number => {
  const outcome = evaluateRound(round);
  const playerShape = round[1];

  return scoreShape(playerShape) + scoreOutcome(outcome);
};

const scoreMatch = (match: Match): number => {
  return sum(match.map(scoreRound));
};

const decodeShape = (code: string): Choice => {
  switch (code) {
    case "A":
    case "X":
      return Choice.Rock;
    case "B":
    case "Y":
      return Choice.Paper;
    case "Z":
    case "C":
      return Choice.Scissor;
    default:
      throw Error(`Invalid encoding: '${code}'.`);
  }
};

const decodeOutcome = (code: string): Outcome => {
  switch (code) {
    case "X":
      return Outcome.Lose;
    case "Y":
      return Outcome.Draw;
    case "Z":
      return Outcome.Win;
    default:
      throw Error(`Invalid encoding: '${code}'.`);
  }
};

const decodeRound = (code: string): Round => code.split(" ").map(decodeShape) as Round;

const selectShape = (opponentShape: Choice, expectedOutcome: Outcome): Choice => {
  switch (opponentShape) {
    case Choice.Rock:
      switch (expectedOutcome) {
        case Outcome.Win:
          return Choice.Paper;
        case Outcome.Lose:
          return Choice.Scissor;
        case Outcome.Draw:
          return Choice.Rock;
        default:
          throw Error(`Invalid outcome: '${expectedOutcome}'`);
      }
    case Choice.Paper:
      switch (expectedOutcome) {
        case Outcome.Win:
          return Choice.Scissor;
        case Outcome.Lose:
          return Choice.Rock;
        case Outcome.Draw:
          return Choice.Paper;
        default:
          throw Error(`Invalid outcome: '${expectedOutcome}'`);
      }
    case Choice.Scissor:
      switch (expectedOutcome) {
        case Outcome.Win:
          return Choice.Rock;
        case Outcome.Lose:
          return Choice.Paper;
        case Outcome.Draw:
          return Choice.Scissor;
        default:
          throw Error(`Invalid outcome: '${expectedOutcome}'`);
      }
    default:
      throw Error(`Invalid opponent shape: '${opponentShape}'`);
  }
};

const decodeSetRound = (code: string): Round => {
  const [opponentShapeCode, outcomeCode] = code.split(" ");
  const opponentShape = decodeShape(opponentShapeCode);

  return [opponentShape, selectShape(opponentShape, decodeOutcome(outcomeCode))];
};

const decodeAsMoves = (codes: string[]): Match => codes.map(decodeRound);

const decodeAsSet = (codes: string[]): Match => codes.map(decodeSetRound);

export default Puzzle.create({
  prepare: Str.lines,
  easy: {
    prepare: decodeAsMoves,
    task: scoreMatch,
  },
  hard: {
    prepare: decodeAsSet,
    task: scoreMatch,
  },
});
