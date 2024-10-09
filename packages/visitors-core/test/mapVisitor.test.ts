import { numberTypeNode, publicKeyTypeNode, tupleTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { mapVisitor, mergeVisitor, staticVisitor, visit, Visitor } from '../src';

test('it maps the return value of a visitor to another', () => {
    // Given the following 3-nodes tree.
    const node = tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]);

    // And a merge visitor A that lists the kind of each node.
    const visitorA = mergeVisitor(
        node => node.kind as string,
        (node, values) => `${node.kind}(${values.join(',')})`,
    );

    // And a mapped visitor B that returns the number of characters returned by visitor A.
    const visitorB = mapVisitor(visitorA, value => value.length);

    // Then we expect the following results when visiting different nodes.
    expect(visit(node, visitorB)).toBe(47);
    expect(visit(node.items[0], visitorB)).toBe(14);
    expect(visit(node.items[1], visitorB)).toBe(17);
});

test('it creates partial visitors from partial visitors', () => {
    // Given the following 3-nodes tree.
    const node = tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]);

    // And partial static visitor A that supports only 2 of these nodes.
    const visitorA = staticVisitor(node => node.kind, ['tupleTypeNode', 'numberTypeNode']);

    // And a mapped visitor B that returns the number of characters returned by visitor A.
    const visitorB = mapVisitor(visitorA, value => value.length);

    // Then both visitors are partial.
    visitorA satisfies Visitor<string, 'numberTypeNode' | 'tupleTypeNode'>;
    visitorB satisfies Visitor<number, 'numberTypeNode' | 'tupleTypeNode'>;

    // Then we expect an error when visiting an unsupported node.
    // @ts-expect-error PublicKeyTypeNode is not supported.
    expect(() => visit(node.items[1], visitorB)).toThrow();
});
