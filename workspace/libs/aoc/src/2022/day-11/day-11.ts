import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";

type InspectFn = (value: number) => number;
type OperatorFn = (a: number, b: number) => number;
type OperandFn = (value: number) => number;
type FindThrowToFn = (value: number) => number;

interface Monkey {
  items: number[];
  inspect: InspectFn;
  readThrowTo: FindThrowToFn;
}

class Monkey {
  static new(items: number[], inspect: InspectFn, findThrowTo: FindThrowToFn): Monkey {
    return new Monkey(items, inspect, findThrowTo);
  }

  private constructor(
    public items: number[],
    public inspect: InspectFn,
    public readThrowTo: FindThrowToFn,
  ) {}
}

namespace Parser {
  const re = {
    items: /(?:(\d+)(?:[,\s]*))+/,
    operation: /= (.+)/,
    int: /\d+/,
  };
  const parseItems = (itemsLine: string): number[] => {
    const [itemsStr] = re.items.exec(itemsLine)!;

    return itemsStr.split(", ").map(Number);
  };

  const add: OperatorFn = (a, b) => a + b;
  const mul: OperatorFn = (a, b) => a * b;
  const identity: OperandFn = (value) => value;
  const parseOperand = (operandStr: string): OperandFn => {
    if (operandStr === "old") return identity;

    const b = +operandStr;
    return () => b;
  };

  const parseOperationFn = (operationLine: string): InspectFn => {
    const [, operationStr] = re.operation.exec(operationLine)!;
    const [operandA, operator, operandB] = operationStr.split(" ");

    const getA = parseOperand(operandA);
    const getB = parseOperand(operandB);
    const operation = operator === "*" ? mul : add;

    return (value) => operation(getA(value), getB(value));
  };

  const parseTestFn = (lineDivisiblity: string, lineWhen: string, lineElse: string) => {
    const [divisiblityStr] = re.int.exec(lineDivisiblity)!;
    const [whenStr] = re.int.exec(lineWhen)!;
    const [elseStr] = re.int.exec(lineElse)!;

    const div = +divisiblityStr;
    const when_ = +whenStr;
    const else_ = +elseStr;
    return [(value: number) => value % div === 0 ? when_ : else_, div] as const;
  };

  const parseMonkey = (lines: string[], offset: number) => {
    const items = parseItems(lines[offset + 1]);
    const operation = parseOperationFn(lines[offset + 2]);
    const [test, divisor] = parseTestFn(lines[offset + 3], lines[offset + 4], lines[offset + 5]);

    return [Monkey.new(items, operation, test), divisor] as const;
  };

  export const parseMonkeys = (content: string): [Monkey[], number] => {
    const lines = Str.lines(content);

    const monkeys: Monkey[] = [];
    const divisors: number[] = [];
    for (let i = 0; i < lines.length; i += 7) {
      const [monkey, divisor] = parseMonkey(lines, i);
      monkeys.push(monkey);
      divisors.push(divisor);
    }

    const lcm = divisors.reduce((a, b) => a * b, 1);
    return [monkeys, lcm] as const;
  };
}

const mulTwoMostCommon = (inspections: number[]): number => {
  let maxAIndex = 0;
  let maxACount = inspections[maxAIndex];
  let maxBIndex = 1;
  let maxBCount = inspections[maxBIndex];

  for (let i = 0; i < inspections.length; ++i) {
    const count = inspections[i];

    if (count > maxACount && maxBIndex !== i) {
      if (maxACount > maxBCount) {
        maxBIndex = maxAIndex;
        maxBCount = maxACount;
      }
      maxACount = count;
      maxAIndex = i;
    }

    if (count > maxBCount && maxAIndex !== i) {
      if (maxACount < maxBCount) {
        maxAIndex = maxBIndex;
        maxACount = maxBCount;
      }
      maxBCount = count;
      maxBIndex = i;
    }
  }

  return maxACount * maxBCount;
};

const inspectRounds = (monkeys: Monkey[], rounds: number, worryFn: OperandFn): number[] => {
  const inspections = Array(monkeys.length).fill(0);

  for (let round = 1; round <= rounds; ++round) {
    for (let i = 0; i < monkeys.length; ++i) {
      const { items, inspect, readThrowTo } = monkeys[i];

      inspections[i] += items.length;
      while (items.length) {
        let item = items.pop()!;
        item = worryFn(inspect(item));

        const throwTo = readThrowTo(item);

        monkeys[throwTo].items.push(item);
      }
    }
  }

  return inspections;
};

const solve = ([monkeys, lcm]: [monkeys: Monkey[], lcm: number], rounds: number, worryFn: OperandFn) => {
  const managedWorryFn = (value: number) => worryFn(value) % lcm;
  return mulTwoMostCommon(inspectRounds(monkeys, rounds, managedWorryFn));
};

export default Puzzle.new({
  prepare: Parser.parseMonkeys,
  easy: (monkeys) => solve(monkeys, 20, (value) => ~~(value / 3)),
  hard: (monkeys) => solve(monkeys, 10_000, (value) => value),
});
