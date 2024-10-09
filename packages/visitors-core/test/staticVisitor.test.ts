import { numberTypeNode, publicKeyTypeNode, tupleTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { staticVisitor, visit } from '../src';

test('it returns the same value for any visited node', () => {
    // Given the following 3-nodes tree.
    const node = tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]);

    // And a static visitor that returns the node kind for any visited node.
    const visitor = staticVisitor(node => node.kind);

    // Then we expect the following results when visiting different nodes.
    expect(visit(node, visitor)).toBe('tupleTypeNode');
    expect(visit(node.items[0], visitor)).toBe('numberTypeNode');
    expect(visit(node.items[1], visitor)).toBe('publicKeyTypeNode');
});

test('it can create partial visitor', () => {
    // Given the following 3-nodes tree.
    const node = tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]);

    // And a static visitor that supports only 2 of these nodes.
    const visitor = staticVisitor(node => node.kind, ['tupleTypeNode', 'numberTypeNode']);

    // Then we expect the following results when visiting supported nodes.
    expect(visit(node, visitor)).toBe('tupleTypeNode');
    expect(visit(node.items[0], visitor)).toBe('numberTypeNode');

    // But expect an error when visiting an unsupported node.
    // @ts-expect-error PublicKeyTypeNode is not supported.
    expect(() => visit(node.items[1], visitor)).toThrow();
});
