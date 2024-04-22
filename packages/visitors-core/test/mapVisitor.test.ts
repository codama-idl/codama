import { numberTypeNode, publicKeyTypeNode, tupleTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import { mapVisitor, mergeVisitor, staticVisitor, visit, Visitor } from '../src/index.js';

test('it maps the return value of a visitor to another', t => {
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
    t.is(visit(node, visitorB), 47);
    t.is(visit(node.items[0], visitorB), 14);
    t.is(visit(node.items[1], visitorB), 17);
});

test('it creates partial visitors from partial visitors', t => {
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
    t.throws(() => visit(node.items[1], visitorB));
});
