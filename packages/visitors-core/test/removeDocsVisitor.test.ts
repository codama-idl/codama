import { integerTypeNode, publicKeyTypeNode, structFieldTypeNode, structTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { removeDocsVisitor, visit } from '../src';

test('it removes the docs from any node that contains docs', () => {
    // Given the following struct node with docs.
    const node = structTypeNode([
        structFieldTypeNode({
            docs: 'The owner of the account.',
            identifier: 'owner',
            type: publicKeyTypeNode(),
        }),
        structFieldTypeNode({
            docs: 'The wallet allowed to modify the account.',
            identifier: 'authority',
            type: publicKeyTypeNode(),
        }),
        structFieldTypeNode({
            docs: 'The amount of tokens in basis points.',
            identifier: 'amount',
            type: integerTypeNode('u64'),
        }),
    ]);

    // When we remove the docs from the node.
    const result = visit(node, removeDocsVisitor());

    // Then we expect the following node with no docs.
    expect(result).toEqual(
        structTypeNode([
            structFieldTypeNode({
                identifier: 'owner',
                type: publicKeyTypeNode(),
            }),
            structFieldTypeNode({
                identifier: 'authority',
                type: publicKeyTypeNode(),
            }),
            structFieldTypeNode({
                identifier: 'amount',
                type: integerTypeNode('u64'),
            }),
        ]),
    );
});

test('it freezes the returned node', () => {
    // Given the following struct node with docs.
    const node = structTypeNode([
        structFieldTypeNode({
            docs: 'The owner of the account.',
            identifier: 'owner',
            type: publicKeyTypeNode(),
        }),
    ]);

    // When we remove the docs from the node.
    const result = visit(node, removeDocsVisitor());

    // Then we expect the returned node to be frozen.
    expect(Object.isFrozen(result)).toBe(true);
});

test('it can create partial visitors', () => {
    // Given the following struct node with docs.
    const node = structTypeNode([
        structFieldTypeNode({
            docs: 'The owner of the account.',
            identifier: 'owner',
            type: publicKeyTypeNode(),
        }),
    ]);

    // And a remove docs visitor that only supports struct type nodes.
    const visitor = removeDocsVisitor({ keys: ['structTypeNode'] });

    // When we use it on our struct node.
    const result = visit(node, visitor);

    // Then we expect the same node back.
    expect(result).toEqual(node);

    // And we expect an error when visiting an unsupported node.
    // @ts-expect-error StructFieldTypeNode is not supported.
    expect(() => visit(node.fields[0], visitor)).toThrow();
});
