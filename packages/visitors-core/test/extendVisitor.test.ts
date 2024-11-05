import { CODAMA_ERROR__VISITORS__CANNOT_EXTEND_MISSING_VISIT_FUNCTION, CodamaError } from '@codama/errors';
import { numberTypeNode, publicKeyTypeNode, tupleTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { extendVisitor, mergeVisitor, visit, voidVisitor } from '../src';

test('it returns a new visitor that extends a subset of visits with a next function', () => {
    // Given the following 3-nodes tree.
    const node = tupleTypeNode([numberTypeNode('u32'), tupleTypeNode([numberTypeNode('u64'), publicKeyTypeNode()])]);

    // And an extended sum visitor that adds an extra 10 to tuple and public key nodes.
    const baseVisitor = mergeVisitor(
        () => 1,
        (_, values) => values.reduce((a, b) => a + b, 1),
    );
    const visitor = extendVisitor(baseVisitor, {
        visitPublicKeyType: (node, { next }) => next(node) + 10,
        visitTupleType: (node, { next }) => next(node) + 10,
    });

    // When we visit the tree using that visitor.
    const result = visit(node, visitor);

    // Then we expect the following count.
    expect(result).toBe(35);

    // And the extended visitor is a new instance.
    expect(baseVisitor).not.toBe(visitor);
});

test('it can visit itself using the exposed self argument', () => {
    // Given the following 3-nodes tree.
    const node = tupleTypeNode([numberTypeNode('u32'), tupleTypeNode([numberTypeNode('u64'), publicKeyTypeNode()])]);

    // And an extended sum visitor that only visit the first item of tuple nodes.
    const baseVisitor = mergeVisitor(
        () => 1,
        (_, values) => values.reduce((a, b) => a + b, 1),
    );
    const visitor = extendVisitor(baseVisitor, {
        visitTupleType: (node, { self }) => (node.items.length > 1 ? visit(node.items[0], self) : 0) + 1,
    });

    // When we visit the tree using that visitor.
    const result = visit(node, visitor);

    // Then we expect the following count.
    expect(result).toBe(2);
});

test('it cannot extends nodes that are not supported by the base visitor', () => {
    // Given a base visitor that only supports tuple nodes.
    const baseVisitor = voidVisitor({ keys: ['tupleTypeNode'] });

    // Then we expect an error when we try to extend other nodes for that visitor.
    expect(() =>
        extendVisitor(baseVisitor, {
            // @ts-expect-error NumberTypeNode is not part of the base visitor.
            visitNumberType: () => undefined,
        }),
    ).toThrow(
        new CodamaError(CODAMA_ERROR__VISITORS__CANNOT_EXTEND_MISSING_VISIT_FUNCTION, {
            visitFunction: 'visitNumberType',
        }),
    );
});
