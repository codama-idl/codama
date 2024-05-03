import { accountValueNode, instructionAccountNode } from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from './_setup';

const node = instructionAccountNode({
    defaultValue: accountValueNode('authority'),
    isOptional: false,
    isSigner: 'either',
    isWritable: true,
    name: 'owner',
});

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 2);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[instructionAccountNode]', null);
    expectDeleteNodesVisitor(node, '[accountValueNode]', instructionAccountNode({ ...node, defaultValue: undefined }));
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
instructionAccountNode [owner.writable.optionalSigner]
|   accountValueNode [authority]`,
    );
});
