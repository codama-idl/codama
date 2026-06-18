import { address } from '@solana/addresses';

import { createConstantPdaSeedValueVisitor } from '../../../src/visitors/pda-seed-value';

const PROGRAM_PUBLIC_KEY = '11111111111111111111111111111111';

export function makeConstantVisitor(overrides?: Partial<Parameters<typeof createConstantPdaSeedValueVisitor>[0]>) {
    return createConstantPdaSeedValueVisitor({
        programId: address(PROGRAM_PUBLIC_KEY),
        ...overrides,
    });
}
