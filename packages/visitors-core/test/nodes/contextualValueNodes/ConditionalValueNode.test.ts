import {
    accountValueNode,
    dataValueNode,
    conditionalValueNode,
    enumValueNode,
    programIdValueNode,
} from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = conditionalValueNode({
    condition: dataValueNode('tokenStandard'),
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
|   dataValueNode [tokenStandard]
|   enumValueNode [ProgrammableNonFungible]
|   |   definedTypeLinkNode [tokenStandard]
|   accountValueNode [mint]
|   programIdValueNode`,
    );
});
