import { definedTypeNode, numberTypeNode, publicKeyTypeNode, TupleTypeNode, tupleTypeNode } from '@kinobi-so/nodes';
import { expect, test } from 'vitest';

import { NodeStack, pipe, recordNodeStackVisitor, tapVisitor, visit, voidVisitor } from '../src';

test('it records the current node stack of a visit', () => {
    // Given the following tree.
    const node = definedTypeNode({
        name: 'myType',
        type: tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]),
    });

    // And a visitor that records the current node stack and stores the number stacks in an array.
    const stack = new NodeStack();
    const numberStacks: NodeStack[] = [];
    const visitor = pipe(
        voidVisitor(),
        v => recordNodeStackVisitor(v, stack),
        v => tapVisitor(v, 'numberTypeNode', () => numberStacks.push(stack.clone())),
    );

    // When we visit the tree.
    visit(node, visitor);

    // Then we expect the number stacks to have been recorded.
    expect(numberStacks.length).toBe(1);
    expect(numberStacks[0].all()).toEqual([node, node.type]);

    // And the current node stack to be empty.
    expect(stack.isEmpty()).toBe(true);
});

test('it includes the current node when applied last', () => {
    // Given the following tree.
    const node = definedTypeNode({
        name: 'myType',
        type: tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]),
    });

    // And a visitor that records the current node stack as the last visitor modifier.
    const stack = new NodeStack();
    const numberStacks: NodeStack[] = [];
    const visitor = pipe(
        voidVisitor(),
        v => tapVisitor(v, 'numberTypeNode', () => numberStacks.push(stack.clone())),
        v => recordNodeStackVisitor(v, stack),
    );

    // When we visit the tree.
    visit(node, visitor);

    // Then we expect the number stacks to have been recorded
    // such that the number node themselves are included in the stack.
    expect(numberStacks.length).toBe(1);
    expect(numberStacks[0].all()).toEqual([node, node.type, (node.type as TupleTypeNode).items[0]]);
});
