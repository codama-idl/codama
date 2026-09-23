import { instructionRemainingAccountsNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from './_setup';

const node = instructionRemainingAccountsNode('remainingAccounts', {
    isSigner: 'either',
    isWritable: true,
});

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 1);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[instructionRemainingAccountsNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(node, `instructionRemainingAccountsNode [writable.optionalSigner]`);
});
