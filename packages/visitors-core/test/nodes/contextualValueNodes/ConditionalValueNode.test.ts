import {
    accountValueNode,
    argumentValueNode,
    conditionalValueNode,
    enumValueNode,
    programIdValueNode,
} from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = conditionalValueNode({
    condition: argumentValueNode('tokenStandard'),
    ifFalse: programIdValueNode(),
    ifTrue: accountValueNode('mint'),
    value: enumValueNode('tokenStandard', 'ProgrammableNonFungible'),
});

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 6);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[conditionalValueNode]', null);
    expectDeleteNodesVisitor(node, '[enumValueNode]', conditionalValueNode({ ...node, value: undefined }));
    expectDeleteNodesVisitor(node, '[accountValueNode]', conditionalValueNode({ ...node, ifTrue: undefined }));
    expectDeleteNodesVisitor(node, '[programIdValueNode]', conditionalValueNode({ ...node, ifFalse: undefined }));
    expectDeleteNodesVisitor(node, ['[accountValueNode]', '[programIdValueNode]'], null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(
        node,
        `
conditionalValueNode
|   argumentValueNode [tokenStandard]
|   enumValueNode [programmableNonFungible]
|   |   definedTypeLinkNode [tokenStandard]
|   accountValueNode [mint]
|   programIdValueNode`,
    );
});
