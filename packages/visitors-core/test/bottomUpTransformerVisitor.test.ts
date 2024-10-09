import { isNode, numberTypeNode, publicKeyTypeNode, stringTypeNode, tupleTypeNode, TYPE_NODES } from '@codama/nodes';
import { expect, test } from 'vitest';

import { bottomUpTransformerVisitor, visit } from '../src';

test('it can transform nodes into other nodes', () => {
    // Given the following tree.
    const node = tupleTypeNode([numberTypeNode('u32'), tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()])]);

    // And a transformer visitor that transforms all number nodes into string nodes.
    const visitor = bottomUpTransformerVisitor([
        node => (isNode(node, 'numberTypeNode') ? stringTypeNode('utf8') : node),
    ]);

    // When we visit the tree using that visitor.
    const result = visit(node, visitor);

    // Then we expect the number nodes to have been transformed into string nodes.
    expect(result).toEqual(
        tupleTypeNode([stringTypeNode('utf8'), tupleTypeNode([stringTypeNode('utf8'), publicKeyTypeNode()])]),
    );
});

test('it can transform nodes using node selectors', () => {
    // Given the following tree.
    const node = tupleTypeNode([numberTypeNode('u32'), tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()])]);

    // And a transformer visitor that selects all number nodes and transforms them into string nodes.
    const visitor = bottomUpTransformerVisitor([
        {
            select: '[numberTypeNode]',
            transform: () => stringTypeNode('utf8'),
        },
    ]);

    // When we visit the tree using that visitor.
    const result = visit(node, visitor);

    // Then we expect the number nodes to have been transformed into string nodes.
    expect(result).toEqual(
        tupleTypeNode([stringTypeNode('utf8'), tupleTypeNode([stringTypeNode('utf8'), publicKeyTypeNode()])]),
    );
});

test('it can create partial transformer visitors', () => {
    // Given the following tree.
    const node = tupleTypeNode([numberTypeNode('u32'), tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()])]);

    // And a transformer visitor that wraps every node into another tuple node
    // but that does not transform public key nodes.
    const visitor = bottomUpTransformerVisitor(
        [node => (isNode(node, TYPE_NODES) ? tupleTypeNode([node]) : node)],
        ['tupleTypeNode', 'numberTypeNode'],
    );

    // When we visit the tree using that visitor.
    const result = visit(node, visitor);

    // Then we expect the following tree.
    expect(result).toEqual(
        tupleTypeNode([
            tupleTypeNode([
                tupleTypeNode([numberTypeNode('u32')]),
                tupleTypeNode([tupleTypeNode([tupleTypeNode([numberTypeNode('u32')]), publicKeyTypeNode()])]),
            ]),
        ]),
    );

    // And the public key node cannot be visited.
    // @ts-expect-error PublicKeyTypeNode is not supported.
    expect(() => visit(publicKeyTypeNode(), visitor)).toThrow();
});

test('it can be used to delete nodes', () => {
    // Given the following tree.
    const node = tupleTypeNode([numberTypeNode('u32'), tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()])]);

    // And a transformer visitor that deletes all number nodes.
    const visitor = bottomUpTransformerVisitor([{ select: '[numberTypeNode]', transform: () => null }]);

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
    const visitor = bottomUpTransformerVisitor([
        {
            select: ['[numberTypeNode]', (_, nodeStack) => nodeStack.all().length > 1],
            transform: () => stringTypeNode('utf8'),
        },
    ]);

    // When we visit the tree using that visitor.
    const result = visit(node, visitor);

    // Then we expect both node selectors to have been applied.
    expect(result).toEqual(
        tupleTypeNode([numberTypeNode('u32'), tupleTypeNode([stringTypeNode('utf8'), publicKeyTypeNode()])]),
    );
});
