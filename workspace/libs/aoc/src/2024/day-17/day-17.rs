use std::fmt::Display;

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

impl Display for OperandCode {
  fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(
      formatter,
      "{}",
      match self {
        OperandCode::Literal0 => "Literal 0",
        OperandCode::Literal1 => "Literal 1",
        OperandCode::Literal2 => "Literal 2",
        OperandCode::Literal3 => "Literal 3",
        OperandCode::AccessA => "Register A",
        OperandCode::AccessB => "Register B",
        OperandCode::AccessC => "Register C",
        OperandCode::Reserved => "Reserved",
      }
    )
  }
}

impl From<u64> for OperandCode {
  fn from(value: u64) -> Self {
    match value {
      0 => OperandCode::Literal0,
      1 => OperandCode::Literal1,
      2 => OperandCode::Literal2,
      3 => OperandCode::Literal3,
      4 => OperandCode::AccessA,
      5 => OperandCode::AccessB,
      6 => OperandCode::AccessC,
      7 => OperandCode::Reserved,
      _ => panic!("Invalid operand code: {}", value),
    }
  }
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

impl Display for OperationCode {
  fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(
      formatter,
      "{}",
      match self {
        OperationCode::XorOBIntoB => "XorOBIntoB",
        OperationCode::TakeO3IntoB => "TakeO3IntoB",
        OperationCode::JumpANotZeroToO => "JumpANotZeroToO",
        OperationCode::XorBCIntoB => "XorBCIntoB",
        OperationCode::Output => "Output",
        OperationCode::DivisionA => "DivisionA",
        OperationCode::DivisionB => "DivisionB",
        OperationCode::DivisionC => "DivisionC",
      }
    )
  }
}

impl From<u64> for OperationCode {
  fn from(value: u64) -> Self {
    match value {
      0 => OperationCode::DivisionA,
      1 => OperationCode::XorOBIntoB,
      2 => OperationCode::TakeO3IntoB,
      3 => OperationCode::JumpANotZeroToO,
      4 => OperationCode::XorBCIntoB,
      5 => OperationCode::Output,
      6 => OperationCode::DivisionB,
      7 => OperationCode::DivisionC,
      _ => panic!("Invalid operation code: {}", value),
    }
  }
}

#[derive(Clone)]
struct PuzzleInput {
  register_a: u64,
  register_b: u64,
  register_c: u64,
  program: Vec<u64>,
}

fn join_output_with_commas(output: &[u64]) -> String {
    let mut result = String::with_capacity(output.len() * 2);
    for (i, val) in output.iter().enumerate() {
        if i > 0 { result.push(','); }
        
        match val {
            0 => result.push('0'),
            1 => result.push('1'), 
            2 => result.push('2'),
            3 => result.push('3'),
            4 => result.push('4'),
            5 => result.push('5'),
            6 => result.push('6'),
            7 => result.push('7'),
            _ => panic!("Invalid output value"),
        }
    }
    result
}


fn load_input_content() -> String {
  let current_file = std::path::PathBuf::from(file!());
  let directory = current_file
    .parent()
    .expect("Failed to get parent directory");
  let path = directory.join("../resources/day-17/input-test.txt");

  std::fs::read_to_string(path).expect("Failed to read input file")
}

fn parse_input(content: &str) -> PuzzleInput {
  fn parse_register(line: &str) -> u64 {
    line.split(": ")
      .nth(1)
      .expect("Invalid register format")
      .parse::<u64>()
      .expect("Failed to parse register value")
  }

  fn parse_program(line: &str) -> Vec<u64> {
    line.split(": ")
      .nth(1)
      .expect("Invalid program format")
      .split(',')
      .map(|s| s.parse::<u64>().expect("Failed to parse program value"))
      .collect()
  }

  let mut lines = content.lines();
  PuzzleInput {
    register_a: parse_register(lines.next().expect("Missing register A line")),
    register_b: parse_register(lines.next().expect("Missing register B line")),
    register_c: parse_register(lines.next().expect("Missing register C line")),
    program: parse_program(lines.skip(1).next().expect("Missing program line")),
  }
}

fn run_program(input: PuzzleInput) -> String {
  let mut index = 0;
  let program = input.program;
  let mut register_a = input.register_a;
  let mut register_b = input.register_b;
  let mut register_c = input.register_c;

  let mut output = vec![];
  let end_index = program.len();
  while index < end_index {
    let operation: OperationCode = program[index].into();
        
    let literal_operand = program[index + 1];
    let combo_operand = match literal_operand.into() {
        OperandCode::Literal0 => literal_operand,
        OperandCode::Literal1 => literal_operand,
        OperandCode::Literal2 => literal_operand,
        OperandCode::Literal3 => literal_operand,
        OperandCode::AccessA => register_a,
        OperandCode::AccessB => register_b,
        OperandCode::AccessC => register_c,
        OperandCode::Reserved => panic!("Reserved operand code"),
        _ => panic!("Invalid operand code"),
    };

    match operation {
      OperationCode::DivisionA => {
        register_a = register_a / (2_u64.pow(combo_operand as u32));
      }
      OperationCode::DivisionB => {
        register_b = register_a / (2_u64.pow(combo_operand as u32));
      }
      OperationCode::DivisionC => {
        register_c = register_a / (2_u64.pow(combo_operand as u32));
      }
      OperationCode::XorOBIntoB => {
        register_b = register_b ^ literal_operand;
      }
      OperationCode::TakeO3IntoB => {
        register_b = combo_operand % 8;
      }
      OperationCode::JumpANotZeroToO => {
        if register_a != 0 {
          index = literal_operand as usize;
          continue;
        }
      }
      OperationCode::XorBCIntoB => {
        register_b = register_b ^ register_c;
      }
      OperationCode::Output => {
        output.push(combo_operand % 8);
      }
    }

    index += 2;
  }

    join_output_with_commas(&output)
}

fn is_program_with_same_output_as_itself(mut input: &mut PuzzleInput) -> bool {
    let mut index = 0;
    let mut output_index = 0;
    let end_index = input.program.len();
    
    while index < end_index {
        let operation: OperationCode = input.program[index].into();
            
        let literal_operand = input.program[index + 1];
        let combo_operand = match literal_operand.into() {
            OperandCode::Literal0 => literal_operand,
            OperandCode::Literal1 => literal_operand,
            OperandCode::Literal2 => literal_operand,
            OperandCode::Literal3 => literal_operand,
            OperandCode::AccessA => input.register_a,
            OperandCode::AccessB => input.register_b,
            OperandCode::AccessC => input.register_c,
            OperandCode::Reserved => panic!("Reserved operand code"),
            _ => panic!("Invalid operand code"),
        };

        match operation {
            OperationCode::DivisionA => {
                input.register_a = input.register_a >> combo_operand;
            }
            OperationCode::DivisionB => {
                input.register_b = input.register_a >> combo_operand; 
            }
            OperationCode::DivisionC => {
                input.register_c = input.register_a >> combo_operand; 
            }
            OperationCode::XorOBIntoB => {
                input.register_b = input.register_b ^ literal_operand;
            }
            OperationCode::TakeO3IntoB => {
                input.register_b = combo_operand & 0b111;
            }
            OperationCode::JumpANotZeroToO => {
                if input.register_a != 0 {
                    index = literal_operand as usize;
                    continue;
                }
            }
            OperationCode::XorBCIntoB => {
                input.register_b ^= input.register_c;
            }
            OperationCode::Output => {
                if (combo_operand & 0b111) != input.program[output_index] {
                    return false;
                }

                output_index += 1;
            }
        }

        index += 2;
    }

    output_index == input.program.len()
}

fn find_register_a_value_which_makes_program_return_itself(mut input: PuzzleInput) -> u64 {
    for i in (0..u64::MAX).step_by(1) {
        if i % 10_000_000 == 0 {
            println!("round: {}, iteration: {}", i / 10_000_000 + 1, i);
        }

        input.register_a = i;
        input.register_b = 0;
        input.register_c = 0;

        if is_program_with_same_output_as_itself(&mut input) {
            return i;
        }
    }

    panic!("No solution found");
}

#[cfg(test)]
mod tests {
  use indoc::*;

  use crate::*;

  #[test]
  fn test_day17_part1() {
    let content = indoc! {"
      Register A: 2024
      Register B: 0
      Register C: 0

      Program: 0,3,5,4,3,0
    "};

    let input = parse_input(&content);

    assert_eq!(input.register_a, 2024);
    assert_eq!(input.register_b, 0);
    assert_eq!(input.register_c, 0);
    assert_eq!(input.program, vec![0, 3, 5, 4, 3, 0]);
  }

  #[test]
  fn test_load_input() {
    let content = load_input_content();

    assert!(content.starts_with("Register A:"));
  }

  #[test]
  fn test_run_program() {
    let content = load_input_content();

    let input = parse_input(&content);
    let output = run_program(input);
    assert_eq!(output, "4,6,3,5,6,3,5,2,1,0");
  }

  #[test]
  fn test_find_register_a_value_which_makes_program_return_itself() {
    let content = indoc! {"
      Register A: 2024
      Register B: 0
      Register C: 0

      Program: 0,3,5,4,3,0
    "};

    let input = parse_input(&content);
    let output = find_register_a_value_which_makes_program_return_itself(input);
    assert_eq!(output, 117440);
  }

  #[test]
  fn test_is_program_with_same_output_as_itself() {
    let content = indoc! {"
        Register A: 117440
        Register B: 0
        Register C: 0

        Program: 0,3,5,4,3,0
    "};

    let mut input = parse_input(&content);
    assert_eq!(is_program_with_same_output_as_itself(&mut input), true);

    let content = indoc! {"
        Register A: 2024
        Register B: 0
        Register C: 0

        Program: 0,3,5,4,3,0
    "};

    let mut input = parse_input(&content);
    assert_eq!(is_program_with_same_output_as_itself(&mut input), false);
  }

  #[test]
  fn test_find_register_a_value_which_makes_program_return_itself_user() {
    let content = indoc! {"
      Register A: 61156655
      Register B: 0
      Register C: 0

      Program: 2,4,1,5,7,5,4,3,1,6,0,3,5,5,3,0
    "};

    let input = parse_input(&content);
    let output = find_register_a_value_which_makes_program_return_itself(input);
    assert_eq!(output, 61156655);
  }

}
