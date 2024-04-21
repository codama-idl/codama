import {
    enumEmptyVariantTypeNode,
    enumStructVariantTypeNode,
    numberTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = enumStructVariantTypeNode(
    'mouseClick',
    structTypeNode([
        structFieldTypeNode({ name: 'x', type: numberTypeNode('u32') }),
        structFieldTypeNode({ name: 'y', type: numberTypeNode('u32') }),
    ]),
);

test(mergeVisitorMacro, node, 6);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[enumStructVariantTypeNode]', null);
test(deleteNodesVisitorMacro, node, '[structTypeNode]', enumEmptyVariantTypeNode('mouseClick'));
test(deleteNodesVisitorMacro, node, '[structFieldTypeNode]', enumEmptyVariantTypeNode('mouseClick'));
test(
    getDebugStringVisitorMacro,
    node,
    `
enumStructVariantTypeNode [mouseClick]
|   structTypeNode
|   |   structFieldTypeNode [x]
|   |   |   numberTypeNode [u32]
|   |   structFieldTypeNode [y]
|   |   |   numberTypeNode [u32]`,
);
