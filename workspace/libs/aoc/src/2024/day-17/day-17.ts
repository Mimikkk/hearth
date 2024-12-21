import { Puzzle } from "../../types/puzzle.ts";
import { Str } from "../../utils/strs.ts";

const re = { number: /(\d+)/g, pairs: /(\d+),(\d+)/g };

enum OperandCode {
  Literal0 = 0,
  Literal1 = 1,
  Literal2 = 2,
  Literal3 = 3,
  AccessA = 4,
  AccessB = 5,
  AccessC = 6,
  Reserved = 7,
}

namespace OperandCode {
  export const toString = (operand: OperandCode) => {
    if (operand === OperandCode.Literal0) return "Literal 0";
    if (operand === OperandCode.Literal1) return "Literal 1";
    if (operand === OperandCode.Literal2) return "Literal 2";
    if (operand === OperandCode.Literal3) return "Literal 3";
    if (operand === OperandCode.AccessA) return "Register A";
    if (operand === OperandCode.AccessB) return "Register B";
    if (operand === OperandCode.AccessC) return "Register C";
    if (operand === OperandCode.Reserved) return "Reserved";
    return "Unknown";
  };
}

enum OperationCode {
  /**
   * Bitwise XOR B and operand value into B
   */
  XorOBIntoB = 1,

  /**
   * Take 3 lowest bits of operand value into B
   */
  TakeO3IntoB = 2,

  /**
   * Jump if A is not zero to operand index
   */
  JumpANotZeroToO = 3,

  /**
   * Bitwise XOR Register A and C into B.
   */
  XorBCIntoB = 4,

  /**
   * Output - Take 3 lowest bits of operand and outputs that value
   */
  Output = 5,
  /*
   * Division
   * The numerator is the value in the register A.
   * The denominator is the operand value to the power of 2.
   * The result is truncated to an integer and then written to register A.
   */
  /**
   * Division - A Variant
   */
  DivisionA = 0,
  /**
   * Division - B Variant
   * stores result in register B
   */
  DivisionB = 6,

  /**
   * Division - C Variant
   * stores result in register C
   */
  DivisionC = 7,
}

namespace OperationCode {
  export const toString = (operation: OperationCode) => {
    if (operation === OperationCode.XorOBIntoB) return "Xor OB into B";
    if (operation === OperationCode.TakeO3IntoB) return "Take O3 into B";
    if (operation === OperationCode.JumpANotZeroToO) return "Jump if A is not zero to O";
    if (operation === OperationCode.XorBCIntoB) return "Xor A and C into B";
    if (operation === OperationCode.Output) return "Output";
    if (operation === OperationCode.DivisionA) return "Division A";
    if (operation === OperationCode.DivisionB) return "Division B";
    if (operation === OperationCode.DivisionC) return "Division C";
    return "Unknown";
  };
}

interface PuzzleInput {
  registerA: number;
  registerB: number;
  registerC: number;
  program: (OperationCode | OperandCode)[];
}

const parseInput = (content: string): PuzzleInput => {
  const [registerAStr, registerBStr, registerCStr, , programStr] = Str.lines(content);
  const registerA = +registerAStr.match(re.number)![0];
  const registerB = +registerBStr.match(re.number)![0];
  const registerC = +registerCStr.match(re.number)![0];
  const program = programStr.match(re.number)!.map(Number);

  return { registerA, registerB, registerC, program };
};

const runProgram = (input: PuzzleInput) => {
  // console.log(input);
  let index = 0;
  const { program } = input;
  let { registerA, registerB, registerC } = input;
  const endIndex = program.length;

  const output = [];
  outer: while (index < endIndex) {
    const operation = program[index] as OperationCode;
    const operand = program[index + 1] as OperandCode;

    let value: number;
    switch (operand) {
      case OperandCode.Literal0: {
        value = 0;
        break;
      }
      case OperandCode.Literal1: {
        value = 1;
        break;
      }
      case OperandCode.Literal2: {
        value = 2;
        break;
      }
      case OperandCode.Literal3: {
        value = 3;
        break;
      }
      case OperandCode.AccessA: {
        value = registerA;
        break;
      }
      case OperandCode.AccessB: {
        value = registerB;
        break;
      }
      case OperandCode.AccessC: {
        value = registerC;
        break;
      }
      default: {
        throw new Error(`Unknown operand: ${operand}`);
      }
    }
    // console.log(`index    : ${colors.red(index.toString())}`);
    // console.log(`operation: ${colors.green(OperationCode.toString(operation))}`);
    // console.log(`operand  : ${colors.green(OperandCode.toString(operand))}`);
    // console.log(`value    : ${colors.yellow(value.toString())}`);
    // console.log(`registerA: ${colors.yellow(registerA.toString())}`);
    // console.log(`registerB: ${colors.yellow(registerB.toString())}`);
    // console.log(`registerC: ${colors.yellow(registerC.toString())}`);
    // console.log("output   :", output);
    // console.log();

    switch (operation) {
      case OperationCode.DivisionA: {
        const result = Math.floor(registerA / (2 ** value));
        registerA = result;
        break;
      }
      case OperationCode.DivisionB: {
        const result = Math.floor(registerA / (2 ** value));
        registerB = result;
        break;
      }
      case OperationCode.DivisionC: {
        const result = Math.floor(registerA / (2 ** value));
        registerC = result;
        break;
      }
      case OperationCode.XorOBIntoB: {
        const result = registerB ^ operand;
        registerB = result;
        break;
      }
      case OperationCode.TakeO3IntoB: {
        const result = value % 8;
        registerB = result;
        break;
      }
      case OperationCode.JumpANotZeroToO: {
        if (registerA !== 0) {
          index = operand;
          continue outer;
        }
        break;
      }
      case OperationCode.XorBCIntoB: {
        const result = registerB ^ registerC;
        registerB = result;
        break;
      }
      case OperationCode.Output: {
        output.push(value % 8);
        break;
      }
      default: {
        throw new Error(`Unknown operation: ${operation}`);
      }
    }

    index += 2;
  }

  // console.log(`index    : ${colors.red(index.toString())}`);
  // console.log(`registerA: ${colors.yellow(registerA.toString())}`);
  // console.log(`registerB: ${colors.yellow(registerB.toString())}`);
  // console.log(`registerC: ${colors.yellow(registerC.toString())}`);
  // console.log("output   :", output);
  // console.log();

  return output.join(",");
};

const findRegisterAvalueWhichMakesProgramReturnItself = (input: PuzzleInput) => {
  const { program } = input;

  for (let i = 0;; ++i) {
    input.registerA = i;
    input.registerB = 0;
    input.registerC = 0;

    if (i % 1_000_000 === 0) {
      console.log(`round: ${i / 1_000_000 + 1}`);
    }

    const result = runProgram(input);
    if (result === program.join(",")) return i;
  }

  throw new Error("No solution found");
};

export default Puzzle.new({
  prepare: parseInput,
  easy: runProgram,
  hard: findRegisterAvalueWhichMakesProgramReturnItself,
});
