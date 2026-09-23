import { integerTypeNode, publicKeyTypeNode, tupleTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { mapVisitor, mergeVisitor, staticVisitor, visit, Visitor } from '../src';

test('it maps the return value of a visitor to another', () => {
    // Given the following 3-nodes tree.
    const item0 = integerTypeNode('u32');
    const item1 = publicKeyTypeNode();
    const node = tupleTypeNode([item0, item1]);

    // And a merge visitor A that lists the kind of each node.
    const visitorA = mergeVisitor(
        node => node.kind as string,
        (node, values) => `${node.kind}(${values.join(',')})`,
    );

    // And a mapped visitor B that returns the number of characters returned by visitor A.
    const visitorB = mapVisitor(visitorA, value => value.length);

    // Then we expect the following results when visiting different nodes.
    expect(visit(node, visitorB)).toBe(52);
    expect(visit(item0, visitorB)).toBe(17);
    expect(visit(item1, visitorB)).toBe(19);
});

test('it creates partial visitors from partial visitors', () => {
    // Given the following 3-nodes tree.
    const node = tupleTypeNode([integerTypeNode('u32'), publicKeyTypeNode()]);

    // And partial static visitor A that supports only 2 of these nodes.
    const visitorA = staticVisitor(node => node.kind, { keys: ['tupleTypeNode', 'integerTypeNode'] });

    // And a mapped visitor B that returns the number of characters returned by visitor A.
    const visitorB = mapVisitor(visitorA, value => value.length);

    // Then both visitors are partial.
    visitorA satisfies Visitor<string, 'integerTypeNode' | 'tupleTypeNode'>;
    visitorB satisfies Visitor<number, 'integerTypeNode' | 'tupleTypeNode'>;

    // Then we expect an error when visiting an unsupported node.
    // @ts-expect-error PublicKeyTypeNode is not supported.
    expect(() => visit(node.items[1], visitorB)).toThrow();
});
