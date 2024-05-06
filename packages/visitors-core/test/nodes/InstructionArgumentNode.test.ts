import { instructionArgumentNode, numberTypeNode, numberValueNode } from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from './_setup';

const node = instructionArgumentNode({
    defaultValue: numberValueNode(1),
    name: 'amount',
    type: numberTypeNode('u64'),
});

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 3);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[instructionArgumentNode]', null);
    expectDeleteNodesVisitor(node, '[numberTypeNode]', null);
    expectDeleteNodesVisitor(
        node,
        '[numberValueNode]',
        instructionArgumentNode({ name: 'amount', type: numberTypeNode('u64') }),
    );
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
instructionArgumentNode [amount]
|   numberTypeNode [u64]
|   numberValueNode [1]`,
    );
});
