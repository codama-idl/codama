import { assertIsNode, Node, numberTypeNode, publicKeyTypeNode, tupleTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import { nonNullableIdentityVisitor, visit } from '../src/index.js';

test('it visits all nodes and returns different instances of the same nodes without returning null', t => {
    // Given the following 3-nodes tree.
    const node = tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]);

    // When we visit it using the non-nullable identity visitor.
    const result = visit(node, nonNullableIdentityVisitor());

    // Then the typed result isn't null.
    result satisfies Node;

    // And we get the same tree back.
    t.deepEqual(result, node);

    // But the nodes are different instances.
    t.not(result, node);
    assertIsNode(result, 'tupleTypeNode');
    t.not(result.items[0], node.items[0]);
    t.not(result.items[1], node.items[1]);
});
