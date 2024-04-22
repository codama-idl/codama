import {
    constantValueNodeFromBytes,
    constantValueNodeFromString,
    hiddenSuffixTypeNode,
    numberTypeNode,
} from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = hiddenSuffixTypeNode(numberTypeNode('u32'), [
    constantValueNodeFromString('utf8', 'hello world'),
    constantValueNodeFromBytes('base16', 'ffff'),
]);

test(mergeVisitorMacro, node, 8);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[hiddenSuffixTypeNode]', null);
test(deleteNodesVisitorMacro, node, '[numberTypeNode]', null);
test(deleteNodesVisitorMacro, node, '[constantValueNode]', numberTypeNode('u32'));
test(
    deleteNodesVisitorMacro,
    node,
    '[stringTypeNode]',
    hiddenSuffixTypeNode(numberTypeNode('u32'), [constantValueNodeFromBytes('base16', 'ffff')]),
);
test(
    getDebugStringVisitorMacro,
    node,
    `
hiddenSuffixTypeNode
|   numberTypeNode [u32]
|   constantValueNode
|   |   stringTypeNode [utf8]
|   |   stringValueNode [hello world]
|   constantValueNode
|   |   bytesTypeNode
|   |   bytesValueNode [base16.ffff]
`,
);
