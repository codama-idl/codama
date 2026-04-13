import path from 'node:path';

import { type Address } from '@solana/addresses';

import type { MplTokenMetadataProgramClient } from '../generated/mpl-token-metadata-idl-types';
import { createTestProgramClient, SvmTestContext } from '../test-utils';

export const programClient = createTestProgramClient<MplTokenMetadataProgramClient>('mpl-token-metadata-idl.json');

/**
 * Loads compiled MPL program binary located at '../dumps/mpl-token-metadata.so' into the test context at the specified program address.
 */
export function loadMplProgram(ctx: SvmTestContext, programAddress: Address): void {
    const programPath = path.resolve(__dirname, '..', 'dumps', 'mpl-token-metadata.so');
    ctx.loadProgram(programAddress, programPath);
}
