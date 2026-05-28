import type { Address } from '@solana/addresses';
import { generateKeyPairSigner } from '@solana/kit';
import { instructionNode, programNode, rootNode } from 'codama';

export async function generateAddress(): Promise<Address> {
    const signer = await generateKeyPairSigner();
    return signer.address;
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
