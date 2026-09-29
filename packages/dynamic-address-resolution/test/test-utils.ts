import type { Address } from '@solana/addresses';
import { generateKeyPairSigner } from '@solana/kit';
import {
    type InstructionAccountNode,
    instructionAccountNode,
    type InstructionAccountNodeInput,
    type InstructionNode,
    instructionNode,
    type InstructionNodeInput,
    type ProgramNode,
    programNode,
    type ProgramNodeInput,
    type RootNode,
    rootNode,
} from 'codama';

export const PROGRAM_ADDRESS = '11111111111111111111111111111111' as Address;

export async function generateAddress(): Promise<Address> {
    const signer = await generateKeyPairSigner();
    return signer.address;
}

export function makeRoot(instructions: InstructionNode[], identifier = 'testProgram') {
    return rootNode(programNode({ identifier, instructions, publicKey: PROGRAM_ADDRESS }));
}

/** An account that is neither a signer nor writable. */
export function account(identifier: string, input: Partial<InstructionAccountNodeInput> = {}): InstructionAccountNode {
    return instructionAccountNode({ identifier, isSigner: false, isWritable: false, ...input });
}

/**
 * Build a root node with a single instruction, and return the path of the
 * given account within it, e.g. to resolve its address.
 */
export function getAccountPath(
    ixAccountNode: InstructionAccountNode,
    instructionInput: Partial<InstructionNodeInput> = {},
    programInput: Partial<ProgramNodeInput> = {},
): {
    instruction: InstructionNode;
    path: readonly [RootNode, ProgramNode, InstructionNode, InstructionAccountNode];
    root: RootNode;
} {
    const instruction = instructionNode({
        identifier: 'testInstruction',
        ...instructionInput,
        accounts: [...(instructionInput.accounts ?? []), ixAccountNode],
    });
    const root = rootNode(
        programNode({
            identifier: 'testProgram',
            publicKey: PROGRAM_ADDRESS,
            ...programInput,
            instructions: [instruction],
        }),
    );
    return { instruction, path: [root, root.program, instruction, ixAccountNode], root };
}
