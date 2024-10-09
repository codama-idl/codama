import { definedTypeLinkNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = definedTypeLinkNode('tokenState', 'splToken');

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 2);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[definedTypeLinkNode]', null);
    expectDeleteNodesVisitor(node, '[programLinkNode]', definedTypeLinkNode('tokenState'));
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
definedTypeLinkNode [tokenState]
|   programLinkNode [splToken]`,
    );
});
