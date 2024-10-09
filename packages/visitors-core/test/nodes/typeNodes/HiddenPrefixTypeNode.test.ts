import {
    constantValueNodeFromBytes,
    constantValueNodeFromString,
    hiddenPrefixTypeNode,
    numberTypeNode,
} from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = hiddenPrefixTypeNode(numberTypeNode('u32'), [
    constantValueNodeFromString('utf8', 'hello world'),
    constantValueNodeFromBytes('base16', 'ffff'),
]);

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 8);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[hiddenPrefixTypeNode]', null);
    expectDeleteNodesVisitor(node, '[numberTypeNode]', null);
    expectDeleteNodesVisitor(node, '[constantValueNode]', numberTypeNode('u32'));
    expectDeleteNodesVisitor(
        node,
        '[stringTypeNode]',
        hiddenPrefixTypeNode(numberTypeNode('u32'), [constantValueNodeFromBytes('base16', 'ffff')]),
    );
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
hiddenPrefixTypeNode
|   constantValueNode
|   |   stringTypeNode [utf8]
|   |   stringValueNode [hello world]
|   constantValueNode
|   |   bytesTypeNode
|   |   bytesValueNode [base16.ffff]
|   numberTypeNode [u32]`,
    );
});
