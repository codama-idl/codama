import { instructionAccountLinkNode, instructionLinkNode } from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = instructionAccountLinkNode('mint', instructionLinkNode('transferTokens', 'splToken'));

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 3);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[instructionAccountLinkNode]', null);
    expectDeleteNodesVisitor(node, '[instructionLinkNode]', instructionAccountLinkNode('mint'));
    expectDeleteNodesVisitor(node, '[programLinkNode]', instructionAccountLinkNode('mint', 'transferTokens'));
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
instructionAccountLinkNode [mint]
|   instructionLinkNode [transferTokens]
|   |   programLinkNode [splToken]`,
    );
});
