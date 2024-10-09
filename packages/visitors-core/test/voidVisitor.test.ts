import { numberTypeNode, publicKeyTypeNode, tupleTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { extendVisitor, visit, voidVisitor } from '../src';

test('it visits all nodes and returns void', () => {
    // Given the following tree.
    const node = tupleTypeNode([numberTypeNode('u32'), tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()])]);

    // And a void visitor extended such that it counts the tuple nodes.
    let counter = 0;
    const visitor = extendVisitor(voidVisitor(), {
        visitTupleType: (node, { next }) => {
            counter++;
            return next(node);
        },
    });

    // When we visit the tree using that visitor.
    const result = visit(node, visitor);

    // Then we expect the counter to match the amount of tuple nodes.
    expect(counter).toBe(2);

    // And a void result.
    expect(result).toBeUndefined();
});
