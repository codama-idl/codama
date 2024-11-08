import test from 'ava';
import { getDummyProgramId, instruction1 } from '../src/index.js';
import { createUmi } from './_setup.js';

test('it can create instruction 1', async (t) => {
  // When we create a dummy instruction.
  const umi = await createUmi();
  const instruction = instruction1(umi).getInstructions()[0];

  // Then we expect the instruction to have the correct program address.
  t.is(instruction.programId, getDummyProgramId(umi));
});
