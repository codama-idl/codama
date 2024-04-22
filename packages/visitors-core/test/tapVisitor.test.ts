import { NumberTypeNode, numberTypeNode, publicKeyTypeNode, tupleTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import { mergeVisitor, tapVisitor, visit } from '../src/index.js';

test('it returns a new instance of the same visitor whilst tapping into one of its visits', t => {
    // Given the following tree.
    const node = tupleTypeNode([numberTypeNode('u32'), tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()])]);

    // And a sum visitor that counts the nodes.
    const visitor = mergeVisitor(
        () => 1,
        (_, values) => values.reduce((a, b) => a + b, 1),
    );

    // And a tap visitor that taps into the numberTypeNode visit and counts them.
    let numberOfNumberNodes = 0;
    const tappedVisitor = tapVisitor(visitor, 'numberTypeNode', node => {
        node satisfies NumberTypeNode;
        numberOfNumberNodes++;
    });

    // When we visit the tree using the tapped visitor.
    const result = visit(node, tappedVisitor);

    // Then we get the expected result.
    t.is(result, 5);

    // And the tapped counter is also correct.
    t.is(numberOfNumberNodes, 2);

    // And the tapped visitor is a new instance.
    t.not(visitor, tappedVisitor);
});
