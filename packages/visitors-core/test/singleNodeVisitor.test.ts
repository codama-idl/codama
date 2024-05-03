import { numberTypeNode, ProgramNode, publicKeyTypeNode, rootNode, tupleTypeNode } from '@kinobi-so/nodes';
import { expect, test } from 'vitest';

import { rootNodeVisitor, singleNodeVisitor, visit } from '../src';

test('it visits a single node and return a custom value', () => {
    // Given the following tree.
    const node = tupleTypeNode([numberTypeNode('u32'), tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()])]);

    // And a visitor that counts the number of direct items in a tuple node.
    const visitor = singleNodeVisitor('tupleTypeNode', node => node.items.length);

    // When we visit the tree using that visitor.
    const result = visit(node, visitor);

    // Then we expect 2 direct items in the tuple node.
    expect(result).toEqual(2);

    // And no other nodes can be visited.
    // @ts-expect-error NumberTypeNode is not supported.
    expect(() => visit(numberTypeNode('u64'), visitor)).toThrow();
    // @ts-expect-error PublicKeyTypeNode is not supported.
    expect(() => visit(publicKeyTypeNode(), visitor)).toThrow();
});

test('it can create rootNode only visitors that return new rootNode instances', () => {
    // Given a root node.
    const node = rootNode({} as ProgramNode);

    // And a root node visitor that adds an additional program node.
    const visitor = rootNodeVisitor(node => rootNode(node.program, [...node.additionalPrograms, {} as ProgramNode]));

    // When we visit the empty root node using that visitor.
    const result = visit(node, visitor);

    // Then we expect the returned root node to have one additional program node.
    expect(result.additionalPrograms.length).toBe(1);
});
