import { instructionLinkNode } from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = instructionLinkNode('transferTokens', 'splToken');

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 2);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[instructionLinkNode]', null);
    expectDeleteNodesVisitor(node, '[programLinkNode]', instructionLinkNode('transferTokens'));
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
instructionLinkNode [transferTokens]
|   programLinkNode [splToken]`,
    );
});
