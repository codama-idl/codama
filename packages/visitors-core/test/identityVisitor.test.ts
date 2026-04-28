import { assertIsNode, numberTypeNode, publicKeyTypeNode, tupleTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { identityVisitor, interceptVisitor, visit } from '../src';

test('it visits all nodes and returns different instances of the same nodes', () => {
    // Given the following 3-nodes tree.
    const node = tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]);

    // When we visit it using the identity visitor.
    const result = visit(node, identityVisitor());

    // Then we get the same tree back.
    expect(result).toEqual(node);

    // But the nodes are different instances.
    expect(result).not.toBe(node);
    assertIsNode(result, 'tupleTypeNode');
    expect(result.items[0]).not.toBe(node.items[0]);
    expect(result.items[1]).not.toBe(node.items[1]);
});

test('it can remove nodes by returning null', () => {
    // Given the following 3-nodes tree.
    const node = tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]);

    // And given an identity visitor overidden to remove all public key nodes.
    const visitor = identityVisitor();
    visitor.visitPublicKeyType = () => null;

    // When we visit it using that visitor.
    const result = visit(node, visitor);

    // Then we expect the following tree back.
    expect(result).toEqual(tupleTypeNode([numberTypeNode('u32')]));
});

test('it can create partial visitors', () => {
    // Given the following 3-nodes tree.
    const node = tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]);

    // And an identity visitor that only supports 2 of these nodes
    // whilst using an interceptor to record the events that happened.
    const events: string[] = [];
    const visitor = interceptVisitor(identityVisitor({ keys: ['tupleTypeNode', 'numberTypeNode'] }), (node, next) => {
        events.push(`visiting:${node.kind}`);
        return next(node);
    });

    // When we visit the tree using that visitor.
    const result = visit(node, visitor);

    // Then we still get the full tree back as different instances.
    expect(result).toEqual(node);
    expect(result).not.toBe(node);
    assertIsNode(result, 'tupleTypeNode');
    expect(result.items[0]).not.toBe(node.items[0]);
    expect(result.items[1]).not.toBe(node.items[1]);

    // But the unsupported node was not visited.
    expect(events).toEqual(['visiting:tupleTypeNode', 'visiting:numberTypeNode']);

    // And the unsupported node cannot be visited.
    // @ts-expect-error PublicKeyTypeNode is not supported.
    expect(() => visit(publicKeyTypeNode(), visitor)).toThrow();
});
