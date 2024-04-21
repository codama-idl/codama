import { numberTypeNode, publicKeyTypeNode, structFieldTypeNode, structTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import { removeDocsVisitor, visit } from '../src/index.js';

test('it empties the docs array of any node that contains docs', t => {
    // Given the following struct node with docs.
    const node = structTypeNode([
        structFieldTypeNode({
            docs: ['The owner of the account.'],
            name: 'owner',
            type: publicKeyTypeNode(),
        }),
        structFieldTypeNode({
            docs: ['The wallet allowed to modify the account.'],
            name: 'authority',
            type: publicKeyTypeNode(),
        }),
        structFieldTypeNode({
            docs: ['The amount of tokens in basis points.'],
            name: 'amount',
            type: numberTypeNode('u64'),
        }),
    ]);

    // When we remove the docs from the node.
    const result = visit(node, removeDocsVisitor());

    // Then we expect the following node.
    t.deepEqual(
        result,
        structTypeNode([
            structFieldTypeNode({
                docs: [],
                name: 'owner',
                type: publicKeyTypeNode(),
            }),
            structFieldTypeNode({
                docs: [],
                name: 'authority',
                type: publicKeyTypeNode(),
            }),
            structFieldTypeNode({
                docs: [],
                name: 'amount',
                type: numberTypeNode('u64'),
            }),
        ]),
    );
});

test('it freezes the returned node', t => {
    // Given the following struct node with docs.
    const node = structTypeNode([
        structFieldTypeNode({
            docs: ['The owner of the account.'],
            name: 'owner',
            type: publicKeyTypeNode(),
        }),
    ]);

    // When we remove the docs from the node.
    const result = visit(node, removeDocsVisitor());

    // Then we expect the returned node to be frozen.
    t.true(Object.isFrozen(result));
});

test('it can create partial visitors', t => {
    // Given the following struct node with docs.
    const node = structTypeNode([
        structFieldTypeNode({
            docs: ['The owner of the account.'],
            name: 'owner',
            type: publicKeyTypeNode(),
        }),
    ]);

    // And a remove docs visitor that only supports struct type nodes.
    const visitor = removeDocsVisitor(['structTypeNode']);

    // When we use it on our struct node.
    const result = visit(node, visitor);

    // Then we expect the same node back.
    t.deepEqual(result, node);

    // And we expect an error when visiting an unsupported node.
    // @ts-expect-error StructFieldTypeNode is not supported.
    t.throws(() => visit(node.fields[0], visitor));
});
