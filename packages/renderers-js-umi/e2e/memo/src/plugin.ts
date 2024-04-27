import { UmiPlugin } from '@metaplex-foundation/umi';
import { createMemoProgram } from './generated';

export const solanaMemo = (): UmiPlugin => ({
  install(umi) {
    umi.programs.add(createMemoProgram(), false);
  },
});
