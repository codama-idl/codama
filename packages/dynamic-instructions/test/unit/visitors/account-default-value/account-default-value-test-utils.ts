import type { InstructionAccountNode } from 'codama';
import { instructionAccountNode, instructionNode, programNode, rootNode } from 'codama';

import { createAccountDefaultValueVisitor } from '../../../../src/instruction-encoding/visitors/account-default-value';
import { SvmTestContext } from '../../../svm-test-context';

export const programAddress = SvmTestContext.generateAddress();
export const rootNodeMock = rootNode(programNode({ name: 'test', publicKey: programAddress }));

export const ixNodeStub = instructionNode({ name: 'testInstruction' });

export const ixAccountNodeStub: InstructionAccountNode = instructionAccountNode({
    isOptional: false,
    isSigner: false,
    isWritable: false,
    name: 'testAccount',
});

export function makeVisitor(overrides?: Partial<Parameters<typeof createAccountDefaultValueVisitor>[0]>) {
    return createAccountDefaultValueVisitor({
        accountAddressInput: undefined,
        accountsInput: undefined,
        argumentsInput: undefined,
        ixAccountNode: ixAccountNodeStub,
        ixNode: ixNodeStub,
        resolutionPath: [],
        resolversInput: undefined,
        root: rootNodeMock,
        ...overrides,
    });
}
