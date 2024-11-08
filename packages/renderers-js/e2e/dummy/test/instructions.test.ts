import test from 'ava';
import {
  DUMMY_PROGRAM_ADDRESS,
  getInstruction1Instruction,
} from '../src/index.js';

test('it can create instruction 1', async (t) => {
  // When we create a dummy instruction.
  const instruction = getInstruction1Instruction();

  // Then we expect the instruction to have the correct program address.
  t.is(instruction.programAddress, DUMMY_PROGRAM_ADDRESS);
});
