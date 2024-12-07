import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";

type Equation = {
  operands: number[];
  result: number;
};

const parseEquations = (content: string): Equation[] =>
  Str.lines(content).map((line) => {
    const [result, operands] = line.split(": ");

    return {
      result: +result,
      operands: operands.split(" ").map(Number),
    };
  });

const isMulAddValid = ({ result, operands }: Equation): boolean => {
  const operandCount = operands.length;
  const operartionCount = operandCount - 1;
  const operations = ["+", "*"];

  const combinations = operations.length ** operartionCount;

  for (let i = 0; i < combinations; ++i) {
    let value = operands[0];
    let combination = i;

    for (let j = 0; j < operartionCount; ++j) {
      const operation = operations[combination % operations.length];
      combination = Math.floor(combination / operations.length);

      if (operation === "+") {
        value += operands[j + 1];
      } else {
        value *= operands[j + 1];
      }
    }

    if (value === result) {
      return true;
    }
  }

  return false;
};

const isMulAddJoinValid = ({ result, operands }: Equation): boolean => {
  const operandCount = operands.length;
  const operartionCount = operandCount - 1;
  const operations = ["+", "*", "||"];

  const combinations = operations.length ** operartionCount;

  for (let i = 0; i < combinations; ++i) {
    let value = operands[0];
    let combination = i;

    for (let j = 0; j < operartionCount; ++j) {
      const operation = operations[combination % operations.length];
      combination = Math.floor(combination / operations.length);

      if (operation === "+") {
        value += operands[j + 1];
      } else if (operation === "*") {
        value *= operands[j + 1];
      } else {
        value = +`${value}${operands[j + 1]}`;
      }
    }

    if (value === result) {
      return true;
    }
  }

  return false;
};

const sumValidEquationSums = (equations: Equation[], validate: (equation: Equation) => boolean) => {
  let sum = 0;

  for (let i = 0; i < equations.length; ++i) {
    const equation = equations[i];

    if (!validate(equation)) continue;

    sum += equation.result;
  }

  return sum;
};

export default Puzzle.new({
  prepare: parseEquations,
  easy: (equations) => sumValidEquationSums(equations, isMulAddValid),
  hard: (equations) => sumValidEquationSums(equations, isMulAddJoinValid),
});
