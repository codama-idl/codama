import { numberTypeNode, publicKeyTypeNode, tupleTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { interceptVisitor, visit, voidVisitor } from '../src';

test('it returns a new visitor that intercepts all visits of a visitor', () => {
    // Given the following 3-nodes tree.
    const node = tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]);

    // And an intercepted void visitor that records the events that happened during each visit.
    const events: string[] = [];
    const baseVisitor = voidVisitor();
    const visitor = interceptVisitor(baseVisitor, (node, next) => {
        events.push(`down:${node.kind}`);
        next(node);
        events.push(`up:${node.kind}`);
    });

    // When we visit the tree using that visitor.
    visit(node, visitor);

    // Then we expect the following events to have happened.
    expect(events).toEqual([
        'down:tupleTypeNode',
        'down:numberTypeNode',
        'up:numberTypeNode',
        'down:publicKeyTypeNode',
        'up:publicKeyTypeNode',
        'up:tupleTypeNode',
    ]);

    // And the intercepted visitor is a new instance.
    expect(baseVisitor).not.toBe(visitor);
});
