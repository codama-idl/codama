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
    expectMergeVisitorCount(node, 1);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[pdaLinkNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(node, `pdaLinkNode [splToken.associatedToken]`);
});
