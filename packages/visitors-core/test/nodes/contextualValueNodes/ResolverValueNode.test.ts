import { accountValueNode, argumentValueNode, resolverValueNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = resolverValueNode('myCustomResolver', {
    dependsOn: [accountValueNode('mint'), argumentValueNode('tokenStandard')],
    importFrom: 'hooked',
});

test(mergeVisitorMacro, node, 3);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[resolverValueNode]', null);
test(deleteNodesVisitorMacro, node, ['[accountValueNode]', '[argumentValueNode]'], { ...node, dependsOn: undefined });
test(
    getDebugStringVisitorMacro,
    node,
    `
resolverValueNode [myCustomResolver.from:hooked]
|   accountValueNode [mint]
|   argumentValueNode [tokenStandard]`,
);
