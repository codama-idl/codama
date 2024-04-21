import {
    numberTypeNode,
    publicKeyTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '@kinobi-so/nodes';
import test from 'ava';

import { getUniqueHashStringVisitor, visit } from '../src/index.js';

test('it returns a unique string representing the whole node', t => {
    // Given the following tree.
    const node = tupleTypeNode([numberTypeNode('u32'), tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()])]);

    // When we get its unique hash string.
    const result = visit(node, getUniqueHashStringVisitor());

    // Then we expect the following string.
    t.deepEqual(
        result,
        '{"items":[' +
            '{"endian":"le","format":"u32","kind":"numberTypeNode"},' +
            '{"items":[{"endian":"le","format":"u32","kind":"numberTypeNode"},{"kind":"publicKeyTypeNode"}],"kind":"tupleTypeNode"}' +
            '],"kind":"tupleTypeNode"}',
    );
});

test('it returns a unique string whilst discard docs', t => {
    // Given the following tree with docs.
    const node = structTypeNode([
        structFieldTypeNode({
            docs: ['The owner of the account.'],
            name: 'owner',
            type: publicKeyTypeNode(),
        }),
    ]);

    // When we get its unique hash string whilst discarding docs.
    const result = visit(node, getUniqueHashStringVisitor({ removeDocs: true }));

    // Then we expect the following string.
    t.deepEqual(
        result,
        '{"fields":[' +
            '{"docs":[],"kind":"structFieldTypeNode","name":"owner","type":{"kind":"publicKeyTypeNode"}}' +
            '],"kind":"structTypeNode"}',
    );
});
