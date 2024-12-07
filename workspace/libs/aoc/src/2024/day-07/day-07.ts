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

type OperationMap = Map<string, (a: number, b: number) => number>;

const validateEquation = ({ result, operands }: Equation, operations: OperationMap): boolean => {
  const keys = operations.keys().toArray();

  const operandCount = operands.length;
  const operationCount = operandCount - 1;
  const combinationCount = keys.length ** operationCount;
  for (let i = 0; i < combinationCount; ++i) {
    let value = operands[0];
    let combination = i;

    for (let j = 0; j < operationCount; ++j) {
      const operation = keys[combination % keys.length];
      combination = ~~(combination / keys.length);

      value = operations.get(operation)!(value, operands[j + 1]);
    }

    if (value === result) return true;
  }

  return false;
};

const createStrategy = (
  operations: [operator: string, resolve: (a: number, b: number) => number][],
): (equation: Equation) => boolean => {
  const map: OperationMap = new Map(operations);
  return (equation) => validateEquation(equation, map);
};

const isValidMulAdd = createStrategy([
  ["+", (a, b) => a + b],
  ["*", (a, b) => a * b],
]);

const isValidMulAddJoin = createStrategy([
  ["+", (a, b) => a + b],
  ["*", (a, b) => a * b],
  ["||", (a, b) => +`${a}${b}`],
]);

const sumValidEquationSums = (equations: Equation[], validate: (equation: Equation) => boolean) =>
  equations.filter(validate).reduce((a, b) => a + b.result, 0);

export default Puzzle.new({
  prepare: parseEquations,
  easy: (equations) => sumValidEquationSums(equations, isValidMulAdd),
  hard: (equations) => sumValidEquationSums(equations, isValidMulAddJoin),
});
