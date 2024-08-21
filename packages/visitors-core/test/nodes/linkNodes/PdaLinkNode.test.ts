import { pdaLinkNode } from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = pdaLinkNode('associatedToken', 'splToken');

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 2);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[pdaLinkNode]', null);
    expectDeleteNodesVisitor(node, '[programLinkNode]', pdaLinkNode('associatedToken'));
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
pdaLinkNode [associatedToken]
|   programLinkNode [splToken]`,
    );
});
