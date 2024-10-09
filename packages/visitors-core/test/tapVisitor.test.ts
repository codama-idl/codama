import { NumberTypeNode, numberTypeNode, publicKeyTypeNode, tupleTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { mergeVisitor, tapVisitor, visit } from '../src';

test('it returns a new instance of the same visitor whilst tapping into one of its visits', () => {
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
    expect(result).toBe(5);

    // And the tapped counter is also correct.
    expect(numberOfNumberNodes).toBe(2);

    // And the tapped visitor is a new instance.
    expect(visitor).not.toBe(tappedVisitor);
});
