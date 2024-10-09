import {
    constantValueNodeFromBytes,
    constantValueNodeFromString,
    hiddenSuffixTypeNode,
    numberTypeNode,
} from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = hiddenSuffixTypeNode(numberTypeNode('u32'), [
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
    expectDeleteNodesVisitor(node, '[hiddenSuffixTypeNode]', null);
    expectDeleteNodesVisitor(node, '[numberTypeNode]', null);
    expectDeleteNodesVisitor(node, '[constantValueNode]', numberTypeNode('u32'));
    expectDeleteNodesVisitor(
        node,
        '[stringTypeNode]',
        hiddenSuffixTypeNode(numberTypeNode('u32'), [constantValueNodeFromBytes('base16', 'ffff')]),
    );
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
hiddenSuffixTypeNode
|   numberTypeNode [u32]
|   constantValueNode
|   |   stringTypeNode [utf8]
|   |   stringValueNode [hello world]
|   constantValueNode
|   |   bytesTypeNode
|   |   bytesValueNode [base16.ffff]`,
    );
});
