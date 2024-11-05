import { UmiPlugin } from '@metaplex-foundation/umi';
import { createDummyProgram } from './generated';

export const solanaDummy = (): UmiPlugin => ({
  install(umi) {
    umi.programs.add(createDummyProgram(), false);
  },
});
