import { numberTypeNode, publicKeyTypeNode, tupleTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import { staticVisitor, visit } from '../src/index.js';

test('it returns the same value for any visited node', t => {
    // Given the following 3-nodes tree.
    const node = tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]);

    // And a static visitor that returns the node kind for any visited node.
    const visitor = staticVisitor(node => node.kind);

    // Then we expect the following results when visiting different nodes.
    t.is(visit(node, visitor), 'tupleTypeNode');
    t.is(visit(node.items[0], visitor), 'numberTypeNode');
    t.is(visit(node.items[1], visitor), 'publicKeyTypeNode');
});

test('it can create partial visitor', t => {
    // Given the following 3-nodes tree.
    const node = tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]);

    // And a static visitor that supports only 2 of these nodes.
    const visitor = staticVisitor(node => node.kind, ['tupleTypeNode', 'numberTypeNode']);

    // Then we expect the following results when visiting supported nodes.
    t.is(visit(node, visitor), 'tupleTypeNode');
    t.is(visit(node.items[0], visitor), 'numberTypeNode');

    // But expect an error when visiting an unsupported node.
    // @ts-expect-error PublicKeyTypeNode is not supported.
    t.throws(() => visit(node.items[1], visitor));
});
