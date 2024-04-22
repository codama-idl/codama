import { numberTypeNode, publicKeyTypeNode, tupleTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import { extendVisitor, visit, voidVisitor } from '../src/index.js';

test('it visits all nodes and returns void', t => {
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
    t.is(counter, 2);

    // And a void result.
    t.is(result, undefined);
});
