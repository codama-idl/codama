import { accountValueNode, pdaSeedValueNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = pdaSeedValueNode('mint', accountValueNode('mint'));

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 2);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[pdaSeedValueNode]', null);
    expectDeleteNodesVisitor(node, '[accountValueNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
pdaSeedValueNode [mint]
|   accountValueNode [mint]`,
    );
});
