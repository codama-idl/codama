import { accountValueNode, argumentValueNode, resolverValueNode } from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = resolverValueNode('myCustomResolver', {
    dependsOn: [accountValueNode('mint'), argumentValueNode('tokenStandard')],
});

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 3);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[resolverValueNode]', null);
    expectDeleteNodesVisitor(node, ['[accountValueNode]', '[argumentValueNode]'], { ...node, dependsOn: undefined });
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
resolverValueNode [myCustomResolver]
|   accountValueNode [mint]
|   argumentValueNode [tokenStandard]`,
    );
});
