import { instructionNode, programNode, rootNode } from 'codama';

import { createConditionNodeValueVisitor } from '../../../../src/instruction-encoding/visitors/condition-node-value';

const rootNodeMock = rootNode(programNode({ name: 'test', publicKey: '11111111111111111111111111111111' }));
const ixNodeStub = instructionNode({ name: 'testInstruction' });

export function makeVisitor(overrides?: Partial<Parameters<typeof createConditionNodeValueVisitor>[0]>) {
    return createConditionNodeValueVisitor({
        accountsInput: undefined,
        argumentsInput: undefined,
        ixNode: ixNodeStub,
        resolutionPath: [],
        resolversInput: undefined,
        root: rootNodeMock,
        ...overrides,
    });
}
