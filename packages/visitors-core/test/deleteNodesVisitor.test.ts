import { numberTypeNode, publicKeyTypeNode, tupleTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import { deleteNodesVisitor, visit } from '../src/index.js';

test('it can delete nodes using selectors', t => {
    // Given the following tree.
    const node = tupleTypeNode([numberTypeNode('u32'), tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()])]);

    // And a visitor that deletes all number nodes.
    const visitor = deleteNodesVisitor(['[numberTypeNode]']);

    // When we visit the tree using that visitor.
    const result = visit(node, visitor);

    // Then we expect the number nodes to have been deleted.
    t.deepEqual(result, tupleTypeNode([tupleTypeNode([publicKeyTypeNode()])]));
});

test('it can create partial visitors', t => {
    // Given the following tree.
    const node = tupleTypeNode([numberTypeNode('u32'), tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()])]);

    // And a visitor that deletes all number nodes and public key nodes
    // but does not support public key nodes.
    const visitor = deleteNodesVisitor(
        ['[numberTypeNode]', '[publicKeyTypeNode]'],
        ['tupleTypeNode', 'numberTypeNode'],
    );

    // When we visit the tree using that visitor.
    const result = visit(node, visitor);

    // Then only the number nodes have been deleted.
    t.deepEqual(result, tupleTypeNode([tupleTypeNode([publicKeyTypeNode()])]));

    // And the public key node cannot be visited.
    // @ts-expect-error PublicKeyTypeNode is not supported.
    t.throws(() => visit(publicKeyTypeNode(), visitor));
});
