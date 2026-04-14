import {
    camelCase,
    type ConditionalValueNode,
    type InstructionAccountNode,
    type InstructionNode,
    type RootNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { resolveConditionalValueNodeCondition } from '../../../src/instruction-encoding/resolvers/resolve-conditional';
import { loadRoot } from '../../programs/test-utils';

function getInstruction(root: RootNode, name: string): InstructionNode {
    const ix = root.program.instructions.find(i => i.name === name);
    if (!ix) throw new Error(`Instruction ${name} not found`);
    return ix;
}

describe('resolveConditionalValueNodeCondition: INVARIANT_VIOLATION', () => {
    test('should throw when conditionalValueNode has no value and no branches', async () => {
        const root = loadRoot('token-idl.json');
        const ix = getInstruction(root, 'transfer');

        const ixAccountNode: InstructionAccountNode = ix.accounts[0];

        const invalidConditional: ConditionalValueNode = {
            condition: { kind: 'accountValueNode', name: camelCase('source') },
            kind: 'conditionalValueNode',
        };

        await expect(
            resolveConditionalValueNodeCondition({
                accountsInput: {},
                argumentsInput: {},
                conditionalValueNode: invalidConditional,
                ixAccountNode,
                ixNode: ix,
                resolutionPath: [],
                resolversInput: {},
                root,
            }),
        ).rejects.toThrow(
            'Internal invariant violation: [Invalid conditionalValueNode: missing value and branches for account source in transfer].',
        );
    });
});
