import {
    constantValueNodeFromBytes,
    constantValueNodeFromString,
    hiddenPrefixTypeNode,
    numberTypeNode,
} from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = hiddenPrefixTypeNode(numberTypeNode('u32'), [
    constantValueNodeFromString('utf8', 'hello world'),
    constantValueNodeFromBytes('base16', 'ffff'),
]);

test(mergeVisitorMacro, node, 8);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[hiddenPrefixTypeNode]', null);
test(deleteNodesVisitorMacro, node, '[numberTypeNode]', null);
test(deleteNodesVisitorMacro, node, '[constantValueNode]', numberTypeNode('u32'));
test(
    deleteNodesVisitorMacro,
    node,
    '[stringTypeNode]',
    hiddenPrefixTypeNode(numberTypeNode('u32'), [constantValueNodeFromBytes('base16', 'ffff')]),
);
test(
    getDebugStringVisitorMacro,
    node,
    `
hiddenPrefixTypeNode
|   constantValueNode
|   |   stringTypeNode [utf8]
|   |   stringValueNode [hello world]
|   constantValueNode
|   |   bytesTypeNode
|   |   bytesValueNode [base16.ffff]
|   numberTypeNode [u32]
`,
);
