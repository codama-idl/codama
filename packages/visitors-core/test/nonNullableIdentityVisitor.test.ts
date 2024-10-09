import { assertIsNode, Node, numberTypeNode, publicKeyTypeNode, tupleTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { nonNullableIdentityVisitor, visit } from '../src';

test('it visits all nodes and returns different instances of the same nodes without returning null', () => {
    // Given the following 3-nodes tree.
    const node = tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]);

    // When we visit it using the non-nullable identity visitor.
    const result = visit(node, nonNullableIdentityVisitor());

    // Then the typed result isn't null.
    result satisfies Node;

    // And we get the same tree back.
    expect(result).toEqual(node);

    // But the nodes are different instances.
    expect(result).not.toBe(node);
    assertIsNode(result, 'tupleTypeNode');
    expect(result.items[0]).not.toBe(node.items[0]);
    expect(result.items[1]).not.toBe(node.items[1]);
});
