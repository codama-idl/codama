import { numberTypeNode, sizePrefixTypeNode, stringTypeNode } from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u32'));

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 3);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[sizePrefixTypeNode]', null);
    expectDeleteNodesVisitor(node, '[stringTypeNode]', null);
    expectDeleteNodesVisitor(node, '[numberTypeNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
sizePrefixTypeNode
|   numberTypeNode [u32]
|   stringTypeNode [utf8]`,
    );
});
