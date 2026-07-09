import { instructionDisplayNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = instructionDisplayNode({
    intent: 'Transfer',
    interpolatedIntent: 'Transfer ${data.amount} to ${accounts.destination}',
});

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 1);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[instructionDisplayNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(node, `instructionDisplayNode`);
});
