import { definedTypeNode, numberTypeNode, publicKeyTypeNode, TupleTypeNode, tupleTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import { NodeStack, pipe, recordNodeStackVisitor, tapVisitor, visit, voidVisitor } from '../src/index.js';

test('it records the current node stack of a visit', t => {
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
    t.is(numberStacks.length, 1);
    t.deepEqual(numberStacks[0].all(), [node, node.type]);

    // And the current node stack to be empty.
    t.true(stack.isEmpty());
});

test('it includes the current node when applied last', t => {
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
    t.is(numberStacks.length, 1);
    t.deepEqual(numberStacks[0].all(), [node, node.type, (node.type as TupleTypeNode).items[0]]);
});
