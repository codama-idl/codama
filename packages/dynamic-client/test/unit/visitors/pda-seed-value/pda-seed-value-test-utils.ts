import { address } from '@solana/addresses';
import { instructionNode, programNode, rootNode } from 'codama';

import { createPdaSeedValueVisitor } from '../../../../src/instruction-encoding/visitors/pda-seed-value';

const PROGRAM_PUBLIC_KEY = '11111111111111111111111111111111';

export const rootNodeMock = rootNode(programNode({ name: 'test', publicKey: PROGRAM_PUBLIC_KEY }));

export const ixNodeStub = instructionNode({ name: 'testInstruction' });

export function makeVisitor(overrides?: Partial<Parameters<typeof createPdaSeedValueVisitor>[0]>) {
    return createPdaSeedValueVisitor({
        accountsInput: undefined,
        argumentsInput: undefined,
        ixNode: ixNodeStub,
        programId: address(PROGRAM_PUBLIC_KEY),
        resolutionPath: [],
        resolversInput: undefined,
        root: rootNodeMock,
        ...overrides,
    });
}
