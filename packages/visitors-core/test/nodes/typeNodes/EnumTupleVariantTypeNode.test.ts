import { enumEmptyVariantTypeNode, enumTupleVariantTypeNode, numberTypeNode, tupleTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitorMacro,
    getDebugStringVisitorMacro,
    identityVisitorMacro,
    mergeVisitorMacro,
} from '../_setup.js';

const node = enumTupleVariantTypeNode('coordinates', tupleTypeNode([numberTypeNode('u32'), numberTypeNode('u32')]));

test(mergeVisitorMacro, node, 4);
test(identityVisitorMacro, node);
test(deleteNodesVisitorMacro, node, '[enumTupleVariantTypeNode]', null);
test(deleteNodesVisitorMacro, node, '[tupleTypeNode]', enumEmptyVariantTypeNode('coordinates'));
test(deleteNodesVisitorMacro, node, '[numberTypeNode]', enumEmptyVariantTypeNode('coordinates'));
test(
    getDebugStringVisitorMacro,
    node,
    `
enumTupleVariantTypeNode [coordinates]
|   tupleTypeNode
|   |   numberTypeNode [u32]
|   |   numberTypeNode [u32]`,
);
