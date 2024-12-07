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

const validateEquation = (
  { result, operands }: Equation,
  operations: Map<string, (a: number, b: number) => number>,
): boolean => {
  const operandCount = operands.length;
  const operationCount = operandCount - 1;
  const operationKeys = Array.from(operations.keys());

  const combinations = operationKeys.length ** operationCount;

  for (let i = 0; i < combinations; ++i) {
    let value = operands[0];
    let combination = i;

    for (let j = 0; j < operationCount; ++j) {
      const operation = operationKeys[combination % operationKeys.length];
      combination = ~~(combination / operationKeys.length);

      value = operations.get(operation)!(value, operands[j + 1]);
    }

    if (value === result) return true;
  }

  return false;
};

const MulAdd = new Map<string, (a: number, b: number) => number>([
  ["+", (a, b) => a + b],
  ["*", (a, b) => a * b],
]);
const MulAddJoin = new Map<string, (a: number, b: number) => number>([
  ["+", (a, b) => a + b],
  ["*", (a, b) => a * b],
  ["||", (a, b) => +`${a}${b}`],
]);
const isValidMulAdd = (equation: Equation): boolean => validateEquation(equation, MulAdd);

const isValidMulAddJoin = (equation: Equation): boolean => validateEquation(equation, MulAddJoin);

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
  easy: (equations) => sumValidEquationSums(equations, isValidMulAdd),
  hard: (equations) => sumValidEquationSums(equations, isValidMulAddJoin),
});
