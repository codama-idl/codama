import path from 'node:path';

import { createProgramClient } from '../../../../src';
import type { ExampleProgramClient } from '../../generated/example-idl-types';
import { loadIdl, SvmTestContext } from '../../test-utils';

export const idl = loadIdl('example-idl.json');
export const programClient = createProgramClient<ExampleProgramClient>(idl);
export const programSoPath = path.resolve(__dirname, '..', 'target', 'deploy', 'example.so');

export function createTestContext() {
    const ctx = new SvmTestContext({ defaultPrograms: true });
    ctx.loadProgram(programClient.programAddress, programSoPath);
    const payer = ctx.createFundedAccount();

    return { ctx, payer };
}

/**
 * Encodes and returns a value in base16 codama dynamic-codecs format.
 * To match bytes decoded by getNodeCodec.
 */
export function bytesToBase16CodecFormat(bytes: Uint8Array) {
    return ['base16', Buffer.from(bytes).toString('hex')] as const;
}
