import { publicKeyValueNode, someValueNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = someValueNode(publicKeyValueNode('73na6yX22Xw3w7q3z39MAwtZyQehEMnUQceszCt94GJ3'));

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 2);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[someValueNode]', null);
    expectDeleteNodesVisitor(node, '[publicKeyValueNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
someValueNode
|   publicKeyValueNode [73na6yX22Xw3w7q3z39MAwtZyQehEMnUQceszCt94GJ3]`,
    );
});
