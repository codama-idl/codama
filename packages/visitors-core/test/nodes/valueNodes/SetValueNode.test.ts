import { publicKeyValueNode, setValueNode } from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = setValueNode([
    publicKeyValueNode('8jeCDm1zPb68kfzv5MaUo9BK7beGzFrGHA9hhMGL1ay1'),
    publicKeyValueNode('8PEBfDem8yb5aUkrhKgNKMraB9gR8WtJDprEW3QwLFz'),
    publicKeyValueNode('97hChLjFswwqBrE82Q4wqctpFfB2jZ91svxCv68iCrqG'),
]);

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 4);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[setValueNode]', null);
    expectDeleteNodesVisitor(node, '[publicKeyValueNode]', { ...node, items: [] });
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
setValueNode
|   publicKeyValueNode [8jeCDm1zPb68kfzv5MaUo9BK7beGzFrGHA9hhMGL1ay1]
|   publicKeyValueNode [8PEBfDem8yb5aUkrhKgNKMraB9gR8WtJDprEW3QwLFz]
|   publicKeyValueNode [97hChLjFswwqBrE82Q4wqctpFfB2jZ91svxCv68iCrqG]`,
    );
});
