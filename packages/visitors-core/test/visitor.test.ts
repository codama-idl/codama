import {
    NumberTypeNode,
    numberTypeNode,
    PublicKeyTypeNode,
    publicKeyTypeNode,
    TupleTypeNode,
    tupleTypeNode,
} from '@kinobi-so/nodes';
import test from 'ava';

import { visit, Visitor, visitOrElse } from '../src/index.js';

test('it can create visitors as plain objects', t => {
    // Given the following tree.
    const node = tupleTypeNode([numberTypeNode('u32'), tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()])]);

    // And a plain object visitor that counts the nodes with different weights.
    const visitor: Visitor<number, 'numberTypeNode' | 'publicKeyTypeNode' | 'tupleTypeNode'> = {
        visitNumberType() {
            return 1;
        },
        visitPublicKeyType() {
            return 2;
        },
        visitTupleType(node) {
            const castedChildren = node.items as (NumberTypeNode | PublicKeyTypeNode | TupleTypeNode)[];
            return castedChildren.map(child => visit(child, this)).reduce((a, b) => a + b, 10);
        },
    };

    // When we visit the tree using that visitor.
    const result = visit(node, visitor);

    // Then we expect the following count.
    t.is(result, 24);
});

test('it can use visitOrElse to fallback if a nested node is not supported by the visitor', t => {
    // Given the following tree.
    const node = tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]);

    // And a plain object visitor that counts the tuples and numbers nodes only
    // Such that it falls back to 42 for any other node.
    const visitor: Visitor<number, 'numberTypeNode' | 'tupleTypeNode'> = {
        visitNumberType() {
            return 1;
        },
        visitTupleType(node) {
            return node.items.map(child => visitOrElse(child, this, () => 42)).reduce((a, b) => a + b, 1);
        },
    };

    // When we visit the tree using that visitor.
    const result = visit(node, visitor);

    // Then we expect the following count.
    t.is(result, 44);
});
