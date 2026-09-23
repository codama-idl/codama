import { integerTypeNode, optionTypeNode, publicKeyTypeNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = optionTypeNode(publicKeyTypeNode(), {
    fixed: true,
    prefix: integerTypeNode('u64'),
});

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 3);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[optionTypeNode]', null);
    expectDeleteNodesVisitor(node, '[publicKeyTypeNode]', null);
    expectDeleteNodesVisitor(node, '[integerTypeNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
optionTypeNode [fixed]
|   integerTypeNode [u64]
|   publicKeyTypeNode`,
    );
});
