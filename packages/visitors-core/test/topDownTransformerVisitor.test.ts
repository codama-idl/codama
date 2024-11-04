import { assertIsNode, isNode, numberTypeNode, publicKeyTypeNode, tupleTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { topDownTransformerVisitor, visit } from '../src';

test('it can transform nodes to the same kind of node', () => {
    // Given the following tree.
    const node = tupleTypeNode([numberTypeNode('u32'), tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()])]);

    // And a transformer visitor that transforms all number nodes into u64 number nodes.
    const visitor = topDownTransformerVisitor([
        node => (isNode(node, 'numberTypeNode') ? (numberTypeNode('u64') as typeof node) : node),
    ]);

    // When we visit the tree using that visitor.
    const result = visit(node, visitor);

    // Then we expect the number nodes to have been transformed into u64 number nodes.
    expect(result).toEqual(
        tupleTypeNode([numberTypeNode('u64'), tupleTypeNode([numberTypeNode('u64'), publicKeyTypeNode()])]),
    );
});

test('it can transform nodes using node selectors', () => {
    // Given the following tree.
    const node = tupleTypeNode([numberTypeNode('u32'), tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()])]);

    // And a transformer visitor that uses a node selector to select all number nodes.
    const visitor = topDownTransformerVisitor([
        {
            select: '[numberTypeNode]',
            transform: node => numberTypeNode('u64') as typeof node,
        },
    ]);

    // When we visit the tree using that visitor.
    const result = visit(node, visitor);

    // Then we expect the number nodes to have been transformed into u64 number nodes.
    expect(result).toEqual(
        tupleTypeNode([numberTypeNode('u64'), tupleTypeNode([numberTypeNode('u64'), publicKeyTypeNode()])]),
    );
});

test('it can create partial transformer visitors', () => {
    // Given the following tree.
    const node = tupleTypeNode([numberTypeNode('u32'), tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()])]);

    // And a tuple-only transformer visitor that prefixes all tuples with another number node.
    const visitor = topDownTransformerVisitor(
        [
            {
                select: '[tupleTypeNode]',
                transform: node => {
                    assertIsNode(node, 'tupleTypeNode');
                    return tupleTypeNode([numberTypeNode('u64'), ...node.items]) as unknown as typeof node;
                },
            },
        ],
        ['tupleTypeNode'],
    );

    // When we visit the tree using that visitor.
    const result = visit(node, visitor);

    // Then we expect the following tree.
    expect(result).toEqual(
        tupleTypeNode([
            numberTypeNode('u64'),
            numberTypeNode('u32'),
            tupleTypeNode([numberTypeNode('u64'), numberTypeNode('u32'), publicKeyTypeNode()]),
        ]),
    );

    // And the other nodes cannot be visited.
    // @ts-expect-error NumberTypeNode is not a tuple node.
    expect(() => visit(numberTypeNode('u64'), visitor)).toThrow();
    // @ts-expect-error PublicKeyTypeNode is not a tuple node.
    expect(() => visit(publicKeyTypeNode(), visitor)).toThrow();
});

test('it can be used to delete nodes', () => {
    // Given the following tree.
    const node = tupleTypeNode([numberTypeNode('u32'), tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()])]);

    // And a transformer visitor that deletes all number nodes.
    const visitor = topDownTransformerVisitor([{ select: '[numberTypeNode]', transform: () => null }]);

    // When we visit the tree using that visitor.
    const result = visit(node, visitor);

    // Then we expect the number nodes to have been deleted.
    expect(result).toEqual(tupleTypeNode([tupleTypeNode([publicKeyTypeNode()])]));
});

test('it can transform nodes using multiple node selectors', () => {
    // Given the following tree.
    const node = tupleTypeNode([numberTypeNode('u32'), tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()])]);

    // And a transformer visitor that uses two node selectors such that
    // - the first one selects all number nodes, and
    // - the second one selects all nodes with more than one ancestor.
    const visitor = topDownTransformerVisitor([
        {
            select: ['[numberTypeNode]', (_, nodeStack) => nodeStack.getPath().length > 1],
            transform: node => numberTypeNode('u64') as typeof node,
        },
    ]);

    // When we visit the tree using that visitor.
    const result = visit(node, visitor);

    // Then we expect both node selectors to have been applied.
    expect(result).toEqual(
        tupleTypeNode([numberTypeNode('u32'), tupleTypeNode([numberTypeNode('u64'), publicKeyTypeNode()])]),
    );
});
