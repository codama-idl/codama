import { instructionArgumentLinkNode, instructionLinkNode } from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = instructionArgumentLinkNode('amount', instructionLinkNode('transferTokens', 'splToken'));

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 3);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[instructionArgumentLinkNode]', null);
    expectDeleteNodesVisitor(node, '[instructionLinkNode]', instructionArgumentLinkNode('amount'));
    expectDeleteNodesVisitor(node, '[programLinkNode]', instructionArgumentLinkNode('amount', 'transferTokens'));
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
instructionArgumentLinkNode [amount]
|   instructionLinkNode [transferTokens]
|   |   programLinkNode [splToken]`,
    );
});
