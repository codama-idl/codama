import { UmiPlugin } from '@metaplex-foundation/umi';
import { createSystemProgram } from './generated';

export const solanaSystem = (): UmiPlugin => ({
  install(umi) {
    umi.programs.add(createSystemProgram(), false);
  },
});
