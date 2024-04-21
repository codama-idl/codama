import {
    accountValueNode,
    argumentValueNode,
    conditionalValueNode,
    enumValueNode,
    programIdValueNode,
} from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = conditionalValueNode({
    condition: argumentValueNode('tokenStandard'),
    ifFalse: programIdValueNode(),
    ifTrue: accountValueNode('mint'),
    value: enumValueNode('tokenStandard', 'ProgrammableNonFungible'),
});

test(mergeVisitorMacro, node, 6);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[conditionalValueNode]', null);
test(deleteNodesVisitorMacro, node, '[enumValueNode]', conditionalValueNode({ ...node, value: undefined }));
test(deleteNodesVisitorMacro, node, '[accountValueNode]', conditionalValueNode({ ...node, ifTrue: undefined }));
test(deleteNodesVisitorMacro, node, '[programIdValueNode]', conditionalValueNode({ ...node, ifFalse: undefined }));
test(deleteNodesVisitorMacro, node, ['[accountValueNode]', '[programIdValueNode]'], null);
test(
    getDebugStringVisitorMacro,
    node,
    `
conditionalValueNode
|   argumentValueNode [tokenStandard]
|   enumValueNode [programmableNonFungible]
|   |   definedTypeLinkNode [tokenStandard]
|   accountValueNode [mint]
|   programIdValueNode`,
);
