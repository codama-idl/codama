import {
    enumEmptyVariantTypeNode,
    enumStructVariantTypeNode,
    enumTupleVariantTypeNode,
    enumTypeNode,
    fixedSizeTypeNode,
    numberTypeNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = enumTypeNode(
    [
        enumEmptyVariantTypeNode('quit'),
        enumTupleVariantTypeNode('write', tupleTypeNode([fixedSizeTypeNode(stringTypeNode('utf8'), 32)])),
        enumStructVariantTypeNode(
            'move',
            structTypeNode([
                structFieldTypeNode({ name: 'x', type: numberTypeNode('u32') }),
                structFieldTypeNode({ name: 'y', type: numberTypeNode('u32') }),
            ]),
        ),
    ],
    { size: numberTypeNode('u64') },
);

test(mergeVisitorMacro, node, 13);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[enumTypeNode]', null);
test(
    deleteNodesVisitorMacro,
    node,
    ['[enumEmptyVariantTypeNode]', '[enumTupleVariantTypeNode]', '[enumStructVariantTypeNode]'],
    { ...node, variants: [] },
);
test(deleteNodesVisitorMacro, node, ['[tupleTypeNode]', '[structFieldTypeNode]'], {
    ...node,
    variants: [enumEmptyVariantTypeNode('quit'), enumEmptyVariantTypeNode('write'), enumEmptyVariantTypeNode('move')],
});
test(
    getDebugStringVisitorMacro,
    node,
    `
enumTypeNode
|   numberTypeNode [u64]
|   enumEmptyVariantTypeNode [quit]
|   enumTupleVariantTypeNode [write]
|   |   tupleTypeNode
|   |   |   fixedSizeTypeNode [32]
|   |   |   |   stringTypeNode [utf8]
|   enumStructVariantTypeNode [move]
|   |   structTypeNode
|   |   |   structFieldTypeNode [x]
|   |   |   |   numberTypeNode [u32]
|   |   |   structFieldTypeNode [y]
|   |   |   |   numberTypeNode [u32]`,
);
