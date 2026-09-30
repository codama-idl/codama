import type { Address } from '@solana/addresses';
import { generateKeyPairSigner } from '@solana/kit';
import {
    type InstructionNode,
    type ProgramNode,
    programNode,
    type ProgramNodeInput,
    type RootNode,
    rootNode,
} from 'codama';

export const PROGRAM_ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address;

export async function generateAddress(): Promise<Address> {
    return (await generateKeyPairSigner()).address;
}

/** Wrap instructions in a root node whose program has the given identifier. */
export function makeRoot(
    instructions: InstructionNode[],
    identifier = 'testProgram',
    programInput: Partial<ProgramNodeInput> = {},
): RootNode {
    return rootNode(programNode({ identifier, publicKey: PROGRAM_ADDRESS, ...programInput, instructions }));
}

/** The path of an instruction wrapped in a root node, e.g. `[root, program, instruction]`. */
export function getInstructionPath(
    instruction: InstructionNode,
    programInput: Partial<ProgramNodeInput> = {},
): readonly [RootNode, ProgramNode, InstructionNode] {
    const root = makeRoot([instruction], 'testProgram', programInput);
    return [root, root.program, instruction];
}
