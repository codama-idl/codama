import { accountLinkNode } from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = accountLinkNode('token', 'splToken');

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 2);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[accountLinkNode]', null);
    expectDeleteNodesVisitor(node, '[programLinkNode]', accountLinkNode('token'));
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
accountLinkNode [token]
|   programLinkNode [splToken]`,
    );
});
