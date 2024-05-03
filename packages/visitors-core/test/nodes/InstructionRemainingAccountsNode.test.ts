import { argumentValueNode, instructionRemainingAccountsNode } from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from './_setup';

const node = instructionRemainingAccountsNode(argumentValueNode('remainingAccounts'), {
    isSigner: 'either',
    isWritable: true,
});

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 2);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[instructionRemainingAccountsNode]', null);
    expectDeleteNodesVisitor(node, '[argumentValueNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
instructionRemainingAccountsNode [writable.optionalSigner]
|   argumentValueNode [remainingAccounts]`,
    );
});
