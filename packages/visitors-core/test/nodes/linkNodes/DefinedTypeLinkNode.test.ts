import { definedTypeLinkNode } from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = definedTypeLinkNode('tokenState', 'splToken');

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 1);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[definedTypeLinkNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(node, `definedTypeLinkNode [splToken.tokenState]`);
});
