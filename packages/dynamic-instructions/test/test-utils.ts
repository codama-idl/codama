import type { Address } from '@solana/addresses';
import { generateKeyPairSigner } from '@solana/kit';
import { instructionNode, programNode, type ProvidedNode, rootNode } from 'codama';

import type { DisplayContext } from '../src/display/types';

export async function generateAddress(): Promise<Address> {
    const signer = await generateKeyPairSigner();
    return signer.address;
}

/** Builds a {@link DisplayContext} with empty defaults, overridable per test. */
export function displayContext(overrides: Partial<DisplayContext> = {}): DisplayContext {
    return {
        accountAddresses: new Map<string, Address>(),
        data: {},
        instruction: instructionNode({ accounts: [], arguments: [], name: 'noop' }),
        provides: new Map<string, ProvidedNode>(),
        resolveDefinedType: () => undefined,
        ...overrides,
    };
}

export function makeRoot(instructions: ReturnType<typeof instructionNode>[], name = 'testProgram') {
    return rootNode(
        programNode({
            instructions,
            name,
            publicKey: '11111111111111111111111111111111',
        }),
    );
}
