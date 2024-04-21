import { numberTypeNode, publicKeyTypeNode, tupleTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import { mergeVisitor, visit } from '../src/index.js';

test('it sets a value for all leaves and merges node values together', t => {
    // Given the following 3-nodes tree.
    const node = tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]);

    // And a visitor that sets the node kind for all leaves and combines
    // them together such that each node lists the kind of its children.
    const visitor = mergeVisitor(
        node => node.kind as string,
        (node, values) => `${node.kind}(${values.join(',')})`,
    );

    // When we visit the tree using that visitor.
    const result = visit(node, visitor);

    // Then we get the following result.
    t.is(result, 'tupleTypeNode(numberTypeNode,publicKeyTypeNode)');
});

test('it can be used to count nodes', t => {
    // Given the following 3-nodes tree.
    const node = tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]);

    // When we visit the tree with a visitor that counts nodes.
    const visitor = mergeVisitor(
        () => 1,
        (_, values) => values.reduce((a, b) => a + b, 1),
    );
    const result = visit(node, visitor);

    // Then we expect to have 3 nodes.
    t.is(result, 3);
});

test('it can create partial visitors', t => {
    // Given the following 3-nodes tree.
    const node = tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]);

    // And a visitor that only supports 2 of these nodes.
    const visitor = mergeVisitor(
        node => node.kind as string,
        (node, values) => `${node.kind}(${values.join(',')})`,
        ['tupleTypeNode', 'numberTypeNode'],
    );

    // When we visit the tree using that visitor.
    const result = visit(node, visitor);

    // Then the unsupported node is not included in the result.
    t.is(result, 'tupleTypeNode(numberTypeNode)');

    // And the unsupported node cannot be visited.
    // @ts-expect-error PublicKeyTypeNode is not supported.
    t.throws(() => visit(publicKeyTypeNode(), visitor));
});
